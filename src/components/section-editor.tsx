"use client";

import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Check, Copy, Download, Eye, EyeOff, FileText, GripVertical, Paperclip, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { apiClient } from "@/lib/api-client";
import { resumeKeys } from "@/lib/query-keys";
import { SECTION_DEFINITIONS, getEmptyItem, type EditableSectionKey } from "@/lib/sections";
import type { ProofFile, ResumeData, ResumeItemData } from "@/lib/types";
import { validateSectionData } from "@/lib/validation";
import { Button } from "@/components/ui/button";

type ItemForm = Record<string, string | number | boolean | null>;
const MAX_PROOF_FILES = 5;
const MAX_PROOF_FILE_SIZE = 10 * 1024 * 1024;

export function SectionEditor({ resume, section, onDraftChange }: { resume: ResumeData; section: EditableSectionKey; onDraftChange: (next: ResumeData) => void }) {
  const definition = SECTION_DEFINITIONS[section];
  const queryClient = useQueryClient();
  const initialItems = useMemo(() => resume.items.filter((item) => item.section === section).toSorted((a, b) => a.sortOrder - b.sortOrder), [resume.items, section]);
  const [items, setItems] = useState(initialItems);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [directoryResults, setDirectoryResults] = useState<Array<{ name: string; externalId: string; provider: string }>>([]);
  const [directoryMessage, setDirectoryMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [pendingProofFiles, setPendingProofFiles] = useState<File[]>([]);
  const [proofError, setProofError] = useState("");
  const { register, reset, getValues, setValue, watch } = useForm<ItemForm>({ defaultValues: getEmptyItem(section) });
  const proofSection = section === "training" || section === "certifications" ? section : null;
  const editingItem = editingId && editingId !== "new" ? items.find((item) => item.id === editingId) : undefined;
  const storedProofFiles = getProofFiles(editingItem);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => setItems(initialItems), [initialItems]);

  const mutation = useMutation({
    mutationFn: (nextItems: ResumeItemData[]) => apiClient.replaceSection(resume.id, section, nextItems.map((item) => ({ id: item.id, isVisible: item.isVisible, data: item.data }))),
    onSuccess: syncSaved,
  });

  const uploadProofMutation = useMutation({
    mutationFn: ({ itemId, files }: { itemId: string; files: File[] }) => {
      if (!proofSection) throw new Error("증빙 파일을 지원하지 않는 항목입니다.");
      return apiClient.uploadProofs(resume.id, proofSection, itemId, files);
    },
    onSuccess: syncSaved,
  });

  const deleteProofMutation = useMutation({
    mutationFn: ({ itemId, fileId }: { itemId: string; fileId: string }) => {
      if (!proofSection) throw new Error("증빙 파일을 지원하지 않는 항목입니다.");
      return apiClient.deleteProof(resume.id, proofSection, itemId, fileId);
    },
    onSuccess: syncSaved,
  });

  function syncSaved(saved: ResumeData) {
    queryClient.setQueryData(resumeKeys.detail(resume.id), saved);
    setItems(saved.items.filter((item) => item.section === section).toSorted((a, b) => a.sortOrder - b.sortOrder));
    onDraftChange(saved);
  }

  function persist(next: ResumeItemData[]) {
    const ordered = next.map((item, index) => ({ ...item, sortOrder: index }));
    setItems(ordered);
    onDraftChange({ ...resume, items: [...resume.items.filter((item) => item.section !== section), ...ordered] });
    return mutation.mutateAsync(ordered);
  }

  function openNew() {
    reset(getEmptyItem(section));
    setEditingId("new");
    setDirectoryResults([]);
    setFormError("");
    setPendingProofFiles([]);
    setProofError("");
  }

  function openEdit(item: ResumeItemData) {
    reset(toItemForm(item.data));
    setEditingId(item.id);
    setDirectoryResults([]);
    setFormError("");
    setPendingProofFiles([]);
    setProofError("");
  }

  async function saveItem() {
    const values = getValues();
    const errors = validateSectionData(section, values);
    if (errors.length) { setFormError(errors[0]); return; }
    setFormError("");
    setProofError("");

    try {
      let itemId = editingId;
      const data: ResumeItemData["data"] = proofSection ? { ...values, proofFiles: storedProofFiles } : values;
      if (editingId === "new") {
        itemId = crypto.randomUUID();
        await persist([...items, { id: itemId, section, sortOrder: items.length, isVisible: section !== "military", data }]);
      } else if (editingId) {
        await persist(items.map((item) => item.id === editingId ? { ...item, data } : item));
      }
      if (itemId && itemId !== "new" && pendingProofFiles.length) {
        await uploadProofMutation.mutateAsync({ itemId, files: pendingProofFiles });
      }
      setPendingProofFiles([]);
      setEditingId(null);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "항목을 저장하지 못했습니다.");
    }
  }

  function selectProofFiles(fileList: FileList | null) {
    if (!fileList) return;
    const selected = Array.from(fileList);
    if (storedProofFiles.length + pendingProofFiles.length + selected.length > MAX_PROOF_FILES) {
      setProofError("증빙 파일은 항목마다 최대 5개까지 첨부할 수 있습니다.");
      return;
    }
    const invalid = selected.find((file) => !/\.(pdf|jpe?g|png|webp|docx?|hwp|hwpx)$/i.test(file.name) || file.size === 0 || file.size > MAX_PROOF_FILE_SIZE);
    if (invalid) {
      setProofError("PDF, 이미지, Word, 한글 문서를 개당 10MB 이하로 첨부해 주세요.");
      return;
    }
    setPendingProofFiles((current) => [...current, ...selected]);
    setProofError("");
  }

  async function removeStoredProof(file: ProofFile) {
    if (!editingItem || !window.confirm(`'${file.name}' 파일을 삭제할까요?`)) return;
    setProofError("");
    try {
      await deleteProofMutation.mutateAsync({ itemId: editingItem.id, fileId: file.id });
    } catch (error) {
      setProofError(error instanceof Error ? error.message : "증빙 파일을 삭제하지 못했습니다.");
    }
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    persist(next);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = items.findIndex((item) => item.id === active.id);
    const to = items.findIndex((item) => item.id === over.id);
    if (from >= 0 && to >= 0) void persist(arrayMove(items, from, to));
  }

  async function searchDirectory() {
    const key = section === "education" ? "schoolName" : "companyName";
    const query = String(getValues(key) ?? "").trim();
    if (query.length < 2) { setDirectoryMessage("두 글자 이상 입력해 주세요."); return; }
    const endpoint = section === "education" ? "schools" : "companies";
    try {
      const response = await fetch(`/api/integrations/${endpoint}/search?q=${encodeURIComponent(query)}`);
      const payload = await response.json() as { results?: Array<{ name: string; externalId: string; provider: string }>; message?: string };
      setDirectoryResults(payload.results ?? []);
      setDirectoryMessage(payload.message ?? ((payload.results?.length ?? 0) ? "" : "검색 결과가 없습니다. 직접 입력할 수 있습니다."));
    } catch {
      setDirectoryMessage("검색에 실패했습니다. 직접 입력을 계속할 수 있습니다.");
    }
  }

  return (
    <section className="editor-form">
      <div className="form-section-heading">
        <div><h2>{definition.label}</h2><p>{definition.description}</p></div>
        <Button variant="primary" onClick={openNew}><Plus size={16} />{definition.itemLabel} 추가</Button>
      </div>

      {mutation.error ? <div className="inline-alert error">{mutation.error.message}</div> : null}
      {items.length === 0 && editingId !== "new" ? <div className="section-empty"><p>아직 입력한 {definition.itemLabel} 항목이 없습니다.</p><Button onClick={openNew}><Plus size={16} />첫 항목 추가</Button></div> : null}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          <div className="editable-list">
            {items.map((item, index) => (
              <SortableRow
                key={item.id}
                item={item}
                index={index}
                itemCount={items.length}
                title={String(item.data[definition.titleField] || `${definition.itemLabel} ${index + 1}`)}
                pending={mutation.isPending || uploadProofMutation.isPending || deleteProofMutation.isPending}
                onMove={move}
                onToggle={() => void persist(items.map((candidate) => candidate.id === item.id ? { ...candidate, isVisible: !candidate.isVisible } : candidate))}
                onCopy={() => void persist([...items.slice(0, index + 1), { ...item, id: crypto.randomUUID(), data: proofSection ? { ...item.data, proofFiles: [] } : item.data }, ...items.slice(index + 1)])}
                onEdit={() => openEdit(item)}
                onDelete={() => { if (window.confirm("이 항목을 삭제할까요?")) void persist(items.filter((candidate) => candidate.id !== item.id)); }}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {editingId ? (
        <div className="item-form-panel">
          <div className="item-form-heading"><h3>{editingId === "new" ? `${definition.itemLabel} 추가` : `${definition.itemLabel} 수정`}</h3><button aria-label="닫기" onClick={() => setEditingId(null)}><X size={18} /></button></div>
          <div className="form-grid">
            {definition.fields.map((field) => (
              <DynamicField key={field.key} field={field} register={register} value={watch(field.key)} />
            ))}
          </div>
          {proofSection ? (
            <div className="proof-attachments">
              <div className="proof-attachments-heading">
                <div>
                  <strong>증빙 파일</strong>
                  <span>최대 5개 · 파일당 10MB · PDF, 이미지, Word, 한글</span>
                </div>
                <label className={`proof-file-picker ${storedProofFiles.length + pendingProofFiles.length >= MAX_PROOF_FILES ? "is-disabled" : ""}`}>
                  <Paperclip size={15} />파일 선택
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.hwp,.hwpx"
                    disabled={storedProofFiles.length + pendingProofFiles.length >= MAX_PROOF_FILES}
                    onChange={(event) => { selectProofFiles(event.target.files); event.currentTarget.value = ""; }}
                  />
                </label>
              </div>
              {storedProofFiles.length || pendingProofFiles.length ? (
                <div className="proof-file-list">
                  {storedProofFiles.map((file) => (
                    <div className="proof-file-row" key={file.id}>
                      <FileText size={17} />
                      <div><strong>{file.name}</strong><span>{formatFileSize(file.size)}</span></div>
                      <a href={`/api/resumes/${resume.id}/sections/${proofSection}/${editingItem?.id}/proofs/${file.id}`} aria-label={`${file.name} 다운로드`} download><Download size={16} /></a>
                      <button type="button" aria-label={`${file.name} 삭제`} disabled={deleteProofMutation.isPending} onClick={() => void removeStoredProof(file)}><Trash2 size={16} /></button>
                    </div>
                  ))}
                  {pendingProofFiles.map((file, index) => (
                    <div className="proof-file-row is-pending" key={`${file.name}-${file.size}-${index}`}>
                      <FileText size={17} />
                      <div><strong>{file.name}</strong><span>{formatFileSize(file.size)} · 항목 저장 시 업로드</span></div>
                      <button type="button" aria-label={`${file.name} 선택 취소`} onClick={() => setPendingProofFiles((current) => current.filter((_, candidateIndex) => candidateIndex !== index))}><X size={16} /></button>
                    </div>
                  ))}
                </div>
              ) : <p className="proof-empty">첨부된 증빙 파일이 없습니다.</p>}
              {proofError || uploadProofMutation.error ? <div className="inline-alert error">{proofError || uploadProofMutation.error?.message}</div> : null}
            </div>
          ) : null}
          {formError ? <div className="inline-alert error">{formError}</div> : null}
          {section === "education" || section === "experience" ? (
            <div className="directory-search">
              <Button size="sm" onClick={() => void searchDirectory()}><Search size={15} />공식 데이터에서 검색</Button>
              <span>검색 결과가 없어도 직접 입력한 값으로 저장됩니다.</span>
              {directoryMessage ? <p>{directoryMessage}</p> : null}
              {directoryResults.length ? <div className="directory-results">{directoryResults.map((result) => <button key={result.externalId} onClick={() => { setValue(section === "education" ? "schoolName" : "companyName", result.name); setDirectoryResults([]); }}><strong>{result.name}</strong><span>{result.provider}</span></button>)}</div> : null}
            </div>
          ) : null}
          <div className="item-form-actions"><Button onClick={() => setEditingId(null)}>취소</Button><Button variant="primary" onClick={() => void saveItem()} loading={mutation.isPending || uploadProofMutation.isPending}><Check size={16} />항목 저장</Button></div>
        </div>
      ) : null}
    </section>
  );
}

function SortableRow({ item, index, itemCount, title, pending, onMove, onToggle, onCopy, onEdit, onDelete }: {
  item: ResumeItemData;
  index: number;
  itemCount: number;
  title: string;
  pending: boolean;
  onMove: (index: number, direction: -1 | 1) => void;
  onToggle: () => void;
  onCopy: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id, disabled: pending });
  return (
    <article
      ref={setNodeRef}
      className={`editable-row ${item.isVisible ? "" : "is-hidden"} ${isDragging ? "is-dragging" : ""}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <div className="editable-row-main"><strong>{title}</strong><span>{itemSummary(item)}</span></div>
      <div className="editable-row-actions">
        <button className="drag-handle" disabled={pending} {...attributes} {...listeners} aria-label="드래그하여 순서 변경"><GripVertical size={16} /></button>
        <button aria-label="위로 이동" disabled={index === 0 || pending} onClick={() => onMove(index, -1)}><ArrowUp size={16} /></button>
        <button aria-label="아래로 이동" disabled={index === itemCount - 1 || pending} onClick={() => onMove(index, 1)}><ArrowDown size={16} /></button>
        <button aria-label={item.isVisible ? "출력에서 제외" : "출력에 포함"} disabled={pending} onClick={onToggle}>{item.isVisible ? <Eye size={16} /> : <EyeOff size={16} />}</button>
        <button aria-label="복제" disabled={pending} onClick={onCopy}><Copy size={16} /></button>
        <button aria-label="수정" disabled={pending} onClick={onEdit}><Pencil size={16} /></button>
        <button aria-label="삭제" disabled={pending} className="danger-text" onClick={onDelete}><Trash2 size={16} /></button>
      </div>
    </article>
  );
}

function DynamicField({ field, register, value }: { field: (typeof SECTION_DEFINITIONS)[EditableSectionKey]["fields"][number]; register: ReturnType<typeof useForm<ItemForm>>["register"]; value: unknown }) {
  const className = field.span === 2 ? "field span-2" : "field";
  if (field.type === "checkbox") return <label className="check-row span-2"><input type="checkbox" {...register(field.key)} checked={Boolean(value)} /><span>{field.label}</span>{field.sensitive ? <small>민감 정보</small> : null}</label>;
  return (
    <label className={className}>
      <span className="field-label">{field.label}{field.sensitive ? <small>민감</small> : null}</span>
      {field.type === "textarea" ? <textarea className="input textarea" rows={4} placeholder={field.placeholder} {...register(field.key)} /> : field.type === "select" ? <select className="input select" {...register(field.key)}><option value="">선택</option>{field.options?.map((option) => <option value={option} key={option}>{option}</option>)}</select> : <input className="input" type={field.type ?? "text"} placeholder={field.placeholder} {...register(field.key)} />}
    </label>
  );
}

function itemSummary(item: ResumeItemData) {
  const values = [item.data.startDate, item.data.endDate, item.data.organization, item.data.position, item.data.issuer, item.data.role]
    .filter((value) => typeof value === "string" && value)
    .slice(0, 3);
  return values.join(" · ") || (item.isVisible ? "출력에 포함" : "출력에서 제외");
}

function toItemForm(data: ResumeItemData["data"]): ItemForm {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => !Array.isArray(value))) as ItemForm;
}

function getProofFiles(item?: ResumeItemData): ProofFile[] {
  return Array.isArray(item?.data.proofFiles) ? item.data.proofFiles : [];
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.ceil(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
