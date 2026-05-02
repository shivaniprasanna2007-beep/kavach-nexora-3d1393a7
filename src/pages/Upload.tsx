import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AppHeader from "@/components/AppHeader";
import { LANGUAGES } from "@/lib/languages";
import { UploadCloud, FileText, X } from "lucide-react";
import { toast } from "sonner";

const MAX_BYTES = 15 * 1024 * 1024;

const UploadPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState("en");
  const [uploading, setUploading] = useState(false);

  const onPick = (f: File | null) => {
    if (!f) return;
    if (f.size > MAX_BYTES) {
      toast.error("File is too large (max 15 MB)");
      return;
    }
    setFile(f);
  };

  const handleUpload = async () => {
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "bin";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("bills")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      const { data: bill, error: insErr } = await supabase
        .from("bills")
        .insert({
          user_id: user.id,
          file_path: path,
          file_mime: file.type,
          language,
          status: "uploaded",
        })
        .select("id")
        .single();
      if (insErr) throw insErr;

      navigate(`/processing/${bill.id}`);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Upload failed");
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container max-w-2xl py-8 md:py-12">
        <h1 className="font-display text-3xl font-bold tracking-tight">Upload your hospital bill</h1>
        <p className="mt-2 text-muted-foreground">PDF, JPG, PNG or HEIC — up to 15 MB.</p>

        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            onPick(e.dataTransfer.files?.[0] ?? null);
          }}
          className="mt-8 cursor-pointer rounded-2xl border-2 border-dashed border-border bg-card p-10 text-center transition-colors hover:border-primary/50 hover:bg-primary/5"
        >
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileText className="h-6 w-6 text-primary" />
              <span className="font-medium">{file.name}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                className="rounded-full p-1 hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <UploadCloud className="mx-auto h-10 w-10 text-primary" />
              <p className="mt-3 font-medium">Click or drag your bill here</p>
              <p className="mt-1 text-sm text-muted-foreground">We never share your documents.</p>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,image/jpeg,image/png,image/heic,image/heif,image/webp"
            className="hidden"
            onChange={(e) => onPick(e.target.files?.[0] ?? null)}
          />
        </div>

        <div className="mt-6">
          <Label>Report language</Label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Button
          size="lg"
          className="mt-8 w-full bg-gradient-hero shadow-elegant"
          disabled={!file || uploading}
          onClick={handleUpload}
        >
          {uploading ? "Uploading…" : "Audit this bill"}
        </Button>
      </main>
    </div>
  );
};

export default UploadPage;