"use client";

import { useEffect, useRef, useState } from "react";
import { Input, Textarea } from "@heroui/input";
import { Button } from "@heroui/button";
import { Form } from "@heroui/form";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelopeOpenText,
  faPaperclip,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { Checkbox } from "@heroui/checkbox";

import { Link } from "@/i18n/navigation";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export default function ContactPage() {
  const t = useTranslations("contact");
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [attachment, setAttachment] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");

  useEffect(() => {
    if (session?.user?.role === "customer") {
      setForm((prev) => ({
        ...prev,
        name: prev.name || session.user.name || "",
        email: prev.email || session.user.email || "",
      }));
    }
  }, [session]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const update = (field: string) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError("");
    const file = e.target.files?.[0] ?? null;

    if (file && file.size > MAX_FILE_SIZE) {
      setFileError(t("file_too_large"));
      setAttachment(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      return;
    }
    setAttachment(file);
  };

  const removeAttachment = () => {
    setAttachment(null);
    setFileError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");

    try {
      const formData = new FormData();

      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("subject", form.subject);
      formData.append("message", form.message);
      if (attachment) formData.append("attachment", attachment);

      const res = await fetch("/api/store/contact", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setStatus("success");
        setForm({ name: "", email: "", subject: "", message: "" });
        removeAttachment();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-24">
      <div
        className="relative w-full max-w-[700px] bg-white dark:bg-surface rounded-[40px] shadow-lg border border-[rgba(88,22,104,0.05)] dark:border-[rgba(180,150,210,0.1)] px-6 py-10 sm:px-12 sm:py-14 overflow-hidden"
        style={{ animation: "fadeInUp 0.8s ease both" }}
      >
        {/* Top gradient accent bar */}
        <div className="absolute top-0 left-0 w-full h-[5px] bg-gradient-to-r from-primary to-accent-gold" />

        {/* Title */}
        <h1
          className="font-heading text-center font-bold text-primary dark:text-white mb-3"
          style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}
        >
          {t("title")}
          <span className="magic-text">{t("title_accent")}</span>
        </h1>

        {/* Subtitle */}
        <p className="text-center text-text-light dark:text-muted mb-10 text-[1.05rem]">
          {t("subtitle")}
        </p>

        {/* Success message */}
        {status === "success" ? (
          <div className="bg-bg-brand dark:bg-surface-alt rounded-[20px] border border-primary/10 p-8 text-center">
            <FontAwesomeIcon
              className="text-primary text-3xl mb-4 block mx-auto"
              icon={faEnvelopeOpenText}
            />
            <p className="font-semibold text-primary dark:text-white text-lg">
              {t("success_title")}
            </p>
            <p className="text-text-light dark:text-muted text-sm mt-1">
              {t("success_desc")}
            </p>
          </div>
        ) : (
          <Form
            className="flex flex-col gap-5"
            validationBehavior="native"
            onSubmit={handleSubmit}
          >
            {status === "error" && (
              <div className="bg-danger-50 text-danger p-4 rounded-2xl text-sm font-medium">
                {t("error")}
              </div>
            )}
            <Input
              isRequired
              errorMessage={t("error_name_max")}
              label={t("name")}
              maxLength={100}
              placeholder={t("name")}
              value={form.name}
              onValueChange={update("name")}
            />
            <Input
              isRequired
              label={t("email")}
              placeholder={t("email")}
              type="email"
              value={form.email}
              onValueChange={update("email")}
            />
            <Input
              isRequired
              errorMessage={t("error_subject_max")}
              label={t("subject")}
              maxLength={200}
              placeholder={t("subject")}
              value={form.subject}
              onValueChange={update("subject")}
            />
            <Textarea
              isRequired
              description={t("message_min")}
              errorMessage={(v) => {
                if (v.validationDetails.tooShort) return t("error_message_min");
                if (v.validationDetails.tooLong) return t("error_message_max");

                return;
              }}
              label={t("message")}
              maxLength={2000}
              minLength={10}
              minRows={5}
              placeholder={t("message")}
              value={form.message}
              onValueChange={update("message")}
            />

            {/* Attachment */}
            <div>
              <label className="block text-sm font-medium text-text-light dark:text-muted mb-1.5">
                {t("attachment")}{" "}
                <span className="text-xs">({t("attachment_hint")})</span>
              </label>

              {attachment ? (
                <div className="flex items-center gap-3 bg-bg-brand dark:bg-surface-alt rounded-xl px-4 py-3 border border-primary/10">
                  <FontAwesomeIcon
                    className="text-primary text-sm"
                    icon={faPaperclip}
                  />
                  <span className="text-sm text-text-light dark:text-muted-light truncate flex-1">
                    {attachment.name}{" "}
                    <span className="text-xs opacity-60">
                      ({(attachment.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </span>
                  <button
                    className="text-text-light hover:text-danger transition-colors"
                    type="button"
                    onClick={removeAttachment}
                  >
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                </div>
              ) : (
                <button
                  className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-primary/20 hover:border-primary/40 rounded-xl px-4 py-3 text-sm text-text-light dark:text-muted transition-colors cursor-pointer"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FontAwesomeIcon icon={faPaperclip} />
                  {t("attachment_add")}
                </button>
              )}

              <input
                ref={fileInputRef}
                accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,.txt,.zip"
                className="hidden"
                type="file"
                onChange={handleFileChange}
              />

              {fileError && (
                <p className="text-danger text-xs mt-1">{fileError}</p>
              )}
            </div>

            <Checkbox
              isRequired
              classNames={{ label: "text-sm" }}
              name="consent"
              value="consent"
            >
              {t.rich("consent", {
                privacy: (chunks) => (
                  <Link
                    className="text-primary underline"
                    href="/privacy"
                    target="_blank"
                  >
                    {chunks}
                  </Link>
                ),
              })}
            </Checkbox>

            <Button
              className="btn-brand bg-primary mt-2 w-full font-semibold"
              isLoading={loading}
              size="lg"
              type="submit"
            >
              {t("send")}
            </Button>
          </Form>
        )}
      </div>
    </main>
  );
}
