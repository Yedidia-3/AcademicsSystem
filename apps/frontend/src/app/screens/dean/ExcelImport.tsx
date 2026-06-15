import { useState, useEffect } from "react";
import { Upload, CheckCircle, XCircle, FileSpreadsheet, ArrowRight, Loader2 } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { api } from "../../../lib/api";

type Step = "upload" | "validate" | "confirm";

interface PLevel { id: number; name: string; }
interface AcademicYear { id: number; name: string; status: string; }
interface ImportResult {
  message: string;
  warnings?: string[];
}

export function ExcelImport() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState<Step>("upload");
  const [pLevels, setPLevels] = useState<PLevel[]>([]);
  const [activeYear, setActiveYear] = useState<AcademicYear | null>(null);
  const [selectedPLevelId, setSelectedPLevelId] = useState<string>(searchParams.get("pLevel") ?? "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loadingPLevels, setLoadingPLevels] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const years = await api.get<any>('/api/v1/academics/academic-years');
        const yearList: AcademicYear[] = Array.isArray(years) ? years : years.data ?? [];
        const active = yearList.find(y => y.status === 'active') ?? null;
        setActiveYear(active);
        if (active) {
          const pl = await api.get<any>(`/api/v1/academics/p-levels?academic_year_id=${active.id}`);
          setPLevels(Array.isArray(pl) ? pl : pl.data ?? []);
        }
      } catch {
        toast.error('Failed to load P-Levels');
      } finally {
        setLoadingPLevels(false);
      }
    };
    loadData();
  }, []);

  const selectedPLevel = pLevels.find(p => p.id.toString() === selectedPLevelId);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUploadAndValidate = async () => {
    if (!selectedPLevelId || !selectedFile || !activeYear) {
      toast.error("Please select a P-Level and upload a file");
      return;
    }

    setIsUploading(true);
    setCurrentStep("validate");
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch(
        `${import.meta.env.VITE_API_URL ?? 'http://localhost:3001'}/api/v1/academics/p-levels/${selectedPLevelId}/import?academic_year_id=${activeYear.id}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          body: formData,
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `Upload failed (${res.status})`);
      }

      const result: ImportResult = await res.json();
      setImportResult(result);
    } catch (err: any) {
      setError(err.message ?? 'Import failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmImport = () => {
    toast.success(`${selectedPLevel?.name} imported — ${importResult?.message}`);
    setTimeout(() => navigate(`/dean/algorithm/${selectedPLevelId}`), 800);
  };

  const handleReset = () => {
    setCurrentStep("upload");
    setSelectedFile(null);
    setImportResult(null);
    setError(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: "#2C2C2C" }}>Import Student Data</h1>
        <p className="text-sm mt-1" style={{ color: "#9A9A9A" }}>Upload Excel file with student information</p>
      </div>

      {/* Steps Indicator */}
      <Card style={{ borderColor: "#E5E5E7" }}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {["Upload", "Validate", "Confirm"].map((step, index) => {
              const stepKey = step.toLowerCase() as Step;
              const stepIndex = ["upload", "validate", "confirm"].indexOf(currentStep);
              const isActive = currentStep === stepKey;
              const isDone = index < stepIndex;
              return (
                <div key={step} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold"
                      style={{ backgroundColor: isActive || isDone ? "#800020" : "#E5E5E7", color: isActive || isDone ? "#fff" : "#9A9A9A" }}>
                      {index + 1}
                    </div>
                    <p className="text-sm mt-2 font-medium" style={{ color: isActive ? "#800020" : "#9A9A9A" }}>{step}</p>
                  </div>
                  {index < 2 && (
                    <div className="h-0.5 w-20 mx-4" style={{ backgroundColor: isDone ? "#800020" : "#E5E5E7" }} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Upload */}
      {currentStep === "upload" && (
        <Card style={{ borderColor: "#E5E5E7" }}>
          <CardContent className="p-6 space-y-6">
            <div>
              <Label>Select P-Level</Label>
              {loadingPLevels ? (
                <div className="mt-2 h-11 flex items-center px-3 border rounded-md" style={{ borderColor: "#E5E5E7" }}>
                  <Loader2 className="animate-spin mr-2" size={16} /> Loading P-Levels...
                </div>
              ) : !activeYear ? (
                <p className="mt-2 text-sm" style={{ color: "#C0392B" }}>No active academic year. Ask the Super Admin to create one.</p>
              ) : (
                <Select value={selectedPLevelId} onValueChange={setSelectedPLevelId}>
                  <SelectTrigger className="w-full h-11 mt-2">
                    <SelectValue placeholder="Select P-Level" />
                  </SelectTrigger>
                  <SelectContent>
                    {pLevels.length === 0 ? (
                      <SelectItem value="__none" disabled>No P-Levels available</SelectItem>
                    ) : (
                      pLevels.map(p => (
                        <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div>
              <Label>Upload Excel File</Label>
              <div className="mt-2 border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ borderColor: "#E5E5E7" }}
                onClick={() => document.getElementById("file-input")?.click()}>
                <input id="file-input" type="file" accept=".xlsx,.xls" onChange={handleFileSelect} className="hidden" />
                {selectedFile ? (
                  <div className="space-y-2">
                    <FileSpreadsheet size={48} className="mx-auto" style={{ color: "#1A7F4B" }} />
                    <p className="font-medium" style={{ color: "#2C2C2C" }}>{selectedFile.name}</p>
                    <p className="text-sm" style={{ color: "#9A9A9A" }}>{(selectedFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload size={48} className="mx-auto" style={{ color: "#C9A84C" }} />
                    <p className="font-medium" style={{ color: "#2C2C2C" }}>Drop your .xlsx file here or click to browse</p>
                    <p className="text-sm" style={{ color: "#9A9A9A" }}>Columns: Name | Rank | Marks% | Former Class</p>
                  </div>
                )}
              </div>
            </div>

            <Button onClick={handleUploadAndValidate} disabled={!selectedPLevelId || !selectedFile || loadingPLevels}
              className="w-full h-11" style={{ backgroundColor: "#800020", color: "#FFFFFF" }}>
              Upload & Validate <ArrowRight size={18} className="ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Validate / Confirm */}
      {(currentStep === "validate" || currentStep === "confirm") && (
        <Card style={{ borderColor: "#E5E5E7" }}>
          <CardContent className="p-6">
            {isUploading ? (
              <div className="text-center py-12">
                <Loader2 size={48} className="mx-auto mb-4 animate-spin" style={{ color: "#800020" }} />
                <p className="font-medium" style={{ color: "#2C2C2C" }}>Validating and importing...</p>
              </div>
            ) : error ? (
              <div className="space-y-6">
                <div className="text-center">
                  <XCircle size={64} className="mx-auto mb-4" style={{ color: "#C0392B" }} />
                  <h3 className="text-xl font-semibold mb-2" style={{ color: "#2C2C2C" }}>Import failed</h3>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-sm" style={{ color: "#C0392B" }}>{error}</p>
                </div>
                <Button onClick={handleReset} variant="ghost" className="w-full">Try Again</Button>
              </div>
            ) : importResult ? (
              <div className="space-y-6">
                <div className="text-center">
                  <CheckCircle size={64} className="mx-auto mb-4" style={{ color: "#1A7F4B" }} />
                  <h3 className="text-xl font-semibold mb-2" style={{ color: "#2C2C2C" }}>Import successful</h3>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span style={{ color: "#9A9A9A" }}>P-Level:</span>
                    <span className="font-semibold" style={{ color: "#2C2C2C" }}>{selectedPLevel?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "#9A9A9A" }}>Result:</span>
                    <span className="font-semibold" style={{ color: "#2C2C2C" }}>{importResult.message}</span>
                  </div>
                </div>
                {(importResult.warnings?.length ?? 0) > 0 && (
                  <div className="bg-yellow-50 rounded-lg p-4 space-y-1">
                    <p className="text-sm font-semibold" style={{ color: "#D97706" }}>Warnings:</p>
                    {importResult.warnings!.map((w, i) => (
                      <p key={i} className="text-sm" style={{ color: "#9A9A9A" }}>{w}</p>
                    ))}
                  </div>
                )}
                <div className="flex gap-3">
                  <Button onClick={handleReset} variant="ghost" className="flex-1">Import Different File</Button>
                  <Button onClick={handleConfirmImport} className="flex-1 h-11"
                    style={{ backgroundColor: "#800020", color: "#FFFFFF" }}>
                    Select Algorithm <ArrowRight size={18} className="ml-2" />
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
