"use client";

import { Camera, MapPin, Trash2, X } from "lucide-react";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field, SelectField, TextAreaField } from "@/components/ui/field";
import type { ProfileData, ResumeData } from "@/lib/types";

type Values = ProfileData & { title: string; headline: string; showDeclaration: boolean; declarationText: string };
type GenderMode = "선택 안 함" | "남성" | "여성" | "직접 입력";

type KakaoPostcodeData = {
  userSelectedType: "R" | "J";
  roadAddress: string;
  jibunAddress: string;
};

type KakaoPostcodeInstance = { embed: (element: HTMLElement) => void };

declare global {
  interface Window {
    kakao?: {
      Postcode: new (options: { oncomplete: (data: KakaoPostcodeData) => void; width?: string; height?: string }) => KakaoPostcodeInstance;
    };
  }
}

export function ProfileForm({ resume, onChange, onSave, onUploadPhoto, onDeletePhoto, photoError, saving }: {
  resume: ResumeData;
  onChange: (values: Values) => void;
  onSave: (values: Values) => void;
  onUploadPhoto: (file: File) => void;
  onDeletePhoto: () => void;
  photoError?: string;
  saving: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const postcodeLayerRef = useRef<HTMLDivElement>(null);
  const initialGender = resume.profile.gender;
  const [genderMode, setGenderMode] = useState<GenderMode>(
    initialGender === "남성" || initialGender === "여성" ? initialGender : initialGender ? "직접 입력" : "선택 안 함",
  );
  const [postcodeReady, setPostcodeReady] = useState(false);
  const [postcodeOpen, setPostcodeOpen] = useState(false);
  const [postcodeError, setPostcodeError] = useState("");
  const { register, watch, getValues, setValue, setFocus, formState: { errors } } = useForm<Values>({
    defaultValues: { ...resume.profile, title: resume.title, headline: resume.headline, showDeclaration: resume.showDeclaration, declarationText: resume.declarationText },
  });

  useEffect(() => {
    const subscription = watch((values) => onChange(values as Values));
    return () => subscription.unsubscribe();
  }, [onChange, watch]);

  useEffect(() => {
    if (!postcodeOpen || !postcodeReady || !postcodeLayerRef.current || !window.kakao?.Postcode) return;
    const layer = postcodeLayerRef.current;
    layer.replaceChildren();
    const postcode = new window.kakao.Postcode({
      width: "100%",
      height: "100%",
      oncomplete: (data) => {
        const selectedAddress = data.userSelectedType === "R" ? data.roadAddress : data.jibunAddress;
        setValue("address", selectedAddress, { shouldDirty: true, shouldTouch: true });
        setPostcodeOpen(false);
        requestAnimationFrame(() => setFocus("address"));
      },
    });
    postcode.embed(layer);
  }, [postcodeOpen, postcodeReady, setFocus, setValue]);

  const visibility = watch("visibility");
  const visible = (key: string) => visibility?.[key] !== false;

  return (
    <form className="editor-form" onSubmit={(event) => { event.preventDefault(); onSave(getValues()); }}>
      <div className="form-section-heading">
        <div><h2>기본 정보</h2><p>채용 담당자가 가장 먼저 확인하는 프로필입니다.</p></div>
      </div>

      <Script
        id="kakao-postcode"
        src="https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
        strategy="lazyOnload"
        onReady={() => { setPostcodeReady(true); setPostcodeError(""); }}
        onError={() => setPostcodeError("주소 검색 서비스를 불러오지 못했습니다. 주소를 직접 입력해 주세요.")}
      />

      <div className="photo-field-row">
        <div className="photo-preview">{resume.profile.photoPath ? <img src={resume.profile.photoPath} alt="업로드한 증명사진" /> : <span>3:4</span>}</div>
        <div><strong>증명사진</strong><p>JPEG, PNG, WebP · 최대 5MB</p><div className="inline-actions"><input ref={fileRef} type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) onUploadPhoto(file); event.currentTarget.value = ""; }} /><Button type="button" size="sm" onClick={() => fileRef.current?.click()} loading={saving}><Camera size={15} />사진 선택</Button>{resume.profile.photoPath ? <Button type="button" size="sm" variant="ghost" onClick={onDeletePhoto}><Trash2 size={15} />삭제</Button> : null}</div>{photoError ? <p className="field-error" role="alert">{photoError}</p> : null}</div>
      </div>

      <div className="form-grid">
        <Field label="관리용 이력서 제목" {...register("title", { required: "제목을 입력해 주세요." })} error={errors.title?.message} className="span-2" />
        <TextAreaField label="한 줄 소개" {...register("headline")} rows={2} maxLength={200} className="span-2" />
        <Field label="이름" {...register("name")} />
        <Field label="영문 이름" {...register("englishName")} />
        <Field label="이메일" type="email" {...register("email")} />
        <VisibilityCheckbox label="이메일 출력" {...register("visibility.email")} checked={visible("email")} />
        <Field label="휴대폰" {...register("phone")} />
        <VisibilityCheckbox label="휴대폰 출력" {...register("visibility.phone")} checked={visible("phone")} />
        <div className="field span-2">
          <label className="field-label" htmlFor="profile-address">주소</label>
          <div className="address-input-row"><input id="profile-address" className="input" {...register("address")} /><Button type="button" size="sm" onClick={() => setPostcodeOpen(true)}><MapPin size={15} />주소 검색</Button></div>
          <span className="field-hint">검색한 주소가 입력되며, 동·호수 등 상세주소는 이어서 직접 입력할 수 있습니다.</span>
        </div>
        <VisibilityCheckbox label="주소 출력" wrapperClassName="span-2" {...register("visibility.address")} checked={visible("address")} />
        <Field label="생년월일" type="date" {...register("birthDate")} />
        <SelectField label="성별" name="genderMode" options={["선택 안 함", "남성", "여성", "직접 입력"]} value={genderMode} onChange={(event) => { const mode = event.target.value as GenderMode; setGenderMode(mode); setValue("gender", mode === "남성" || mode === "여성" ? mode : "", { shouldDirty: true, shouldTouch: true }); }} />
        {genderMode === "직접 입력" ? <Field label="성별 직접 입력" {...register("gender")} autoFocus /> : null}
        <Field label="웹사이트" type="url" {...register("website")} className="span-2" />
        <Field label="GitHub" type="url" {...register("github")} className="span-2" />
        <Field label="LinkedIn" type="url" {...register("linkedin")} className="span-2" />
        <TextAreaField label="자기소개 요약" {...register("summary")} rows={4} maxLength={3000} className="span-2" />
      </div>

      <div className="subsection-block">
        <h3>문서 설정</h3>
        <label className="check-row"><input type="checkbox" {...register("showDeclaration")} /><span>사실 확인 문구를 출력합니다.</span></label>
        {watch("showDeclaration") ? <TextAreaField label="추가 문구" {...register("declarationText")} rows={3} /> : null}
      </div>

      <div className="form-submit-row"><Button type="submit" variant="primary" loading={saving}>지금 저장</Button></div>

      {postcodeOpen ? (
        <div className="postcode-overlay" role="presentation">
          <section className="postcode-dialog" role="dialog" aria-modal="true" aria-labelledby="postcode-title">
            <header><div><h3 id="postcode-title">주소 검색</h3><p>도로명, 건물명 또는 지번으로 검색하세요.</p></div><button type="button" aria-label="주소 검색 닫기" onClick={() => setPostcodeOpen(false)}><X size={20} /></button></header>
            {postcodeError ? <div className="postcode-state"><p role="alert">{postcodeError}</p><Button type="button" onClick={() => setPostcodeOpen(false)}>직접 입력하기</Button></div> : null}
            {!postcodeError && !postcodeReady ? <div className="postcode-state"><span className="postcode-spinner" /><p>주소 검색 서비스를 불러오는 중입니다.</p></div> : null}
            <div ref={postcodeLayerRef} className="postcode-layer" hidden={!postcodeReady || Boolean(postcodeError)} />
            <footer>카카오 우편번호 서비스 · 검색이 어려우면 창을 닫고 직접 입력할 수 있습니다.</footer>
          </section>
        </div>
      ) : null}
    </form>
  );
}

function VisibilityCheckbox({ label, wrapperClassName, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; wrapperClassName?: string }) {
  return <label className={`visibility-field ${wrapperClassName ?? ""}`}><input type="checkbox" {...props} /><span>{label}</span></label>;
}
