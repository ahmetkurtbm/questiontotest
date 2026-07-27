"use client";

import { ANSWER_KEYS, DIFFICULTIES, SUBJECT_GROUPS } from "@/lib/subjects";

export function SubjectSelect({ value, onChange, allowAny = false, anyLabel = "Tüm konular", ...rest }) {
  return (
    <select className="select" value={value} onChange={(e) => onChange(e.target.value)} {...rest}>
      {allowAny && <option value="">{anyLabel}</option>}
      {SUBJECT_GROUPS.map((group) => (
        <optgroup key={group.group} label={group.group}>
          {group.items.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

export function DifficultySelect({ value, onChange, allowAny = false, anyLabel = "Tüm zorluklar", ...rest }) {
  return (
    <select className="select" value={value} onChange={(e) => onChange(e.target.value)} {...rest}>
      {allowAny && <option value="">{anyLabel}</option>}
      {DIFFICULTIES.map((level) => (
        <option key={level} value={level}>
          {level}
        </option>
      ))}
    </select>
  );
}

export function AnswerSelect({ value, onChange, allowAny = false, anyLabel = "Tüm cevaplar", ...rest }) {
  return (
    <select className="select" value={value} onChange={(e) => onChange(e.target.value)} {...rest}>
      {allowAny && <option value="">{anyLabel}</option>}
      {ANSWER_KEYS.map((key) => (
        <option key={key} value={key}>
          {key}
        </option>
      ))}
    </select>
  );
}

export function DifficultyBadge({ value }) {
  const slug = String(value || "").toLocaleLowerCase("tr");
  return <span className={`badge badge-${slug}`}>{value}</span>;
}

/** Konu + zorluk + cevap ucluSu; soru ekleme, PDF aktarma ve duzenlemede ortak. */
export function QuestionMetaFields({ value, onChange, idPrefix = "meta" }) {
  const set = (key) => (next) => onChange({ ...value, [key]: next });

  return (
    <div className="form-grid">
      <div className="field" style={{ gridColumn: "1 / -1" }}>
        <label htmlFor={`${idPrefix}-subject`}>Konu</label>
        <SubjectSelect id={`${idPrefix}-subject`} value={value.subject} onChange={set("subject")} />
      </div>
      <div className="field">
        <label htmlFor={`${idPrefix}-difficulty`}>Zorluk</label>
        <DifficultySelect
          id={`${idPrefix}-difficulty`}
          value={value.difficulty}
          onChange={set("difficulty")}
        />
      </div>
      <div className="field">
        <label htmlFor={`${idPrefix}-answer`}>Doğru cevap</label>
        <AnswerSelect id={`${idPrefix}-answer`} value={value.answer} onChange={set("answer")} />
      </div>
    </div>
  );
}
