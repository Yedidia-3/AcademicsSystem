import { useState } from "react";
import { Upload, CheckCircle, XCircle, FileSpreadsheet, ArrowRight } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { useNavigate } from "react-router";
import { toast } from "sonner";

type Step = "upload" | "validate" | "confirm";

interface ValidationResult {
  success: boolean;
  pLevel: string;
  sheets: string[];
  totalStudents: number;
  errors?: Array<{ sheet: string; row: number; error: string }>;
}

export function ExcelImport() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>("upload");
  const [selectedPLevel, setSelectedPLevel] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadAndValidate = () => {
    if (!selectedPLevel || !selectedFile) {
      toast.error("Please select a P-Level and upload a file");
      return;
    }

    setIsValidating(true);
    setCurrentStep("validate");

    // Simulate validation
    setTimeout(() => {
      // Simulate successful validation
      const result: ValidationResult = {
        success: true,
        pLevel: selectedPLevel,
        sheets: [`${selectedPLevel}A`, `${selectedPLevel}B`, `${selectedPLevel}C`],
        totalStudents: 95,
      };

      setValidationResult(result);
      setIsValidating(false);
    }, 2000);
  };

  const handleConfirmImport = () => {
    toast.success(`${selectedPLevel} imported successfully — ${validationResult?.totalStudents} students loaded`);
    setTimeout(() => {
      navigate(`/dean/algorithm/${selectedPLevel}`);
    }, 1000);
  };

  const handleUploadDifferentFile = () => {
    setCurrentStep("upload");
    setSelectedFile(null);
    setValidationResult(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: "#2C2C2C" }}>
          Import Student Data
        </h1>
        <p className="text-sm mt-1" style={{ color: "#9A9A9A" }}>
          Upload Excel file with student information
        </p>
      </div>

      {/* Steps Indicator */}
      <Card style={{ borderColor: "#E5E5E7" }}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {["Upload", "Validate", "Confirm"].map((step, index) => (
              <div key={step} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      currentStep === step.toLowerCase()
                        ? "text-white"
                        : index <
                          ["upload", "validate", "confirm"].indexOf(currentStep)
                        ? "text-white"
                        : "text-gray-400"
                    }`}
                    style={{
                      backgroundColor:
                        currentStep === step.toLowerCase() ||
                        index < ["upload", "validate", "confirm"].indexOf(currentStep)
                          ? "#800020"
                          : "#E5E5E7",
                    }}
                  >
                    {index + 1}
                  </div>
                  <p
                    className="text-sm mt-2 font-medium"
                    style={{
                      color:
                        currentStep === step.toLowerCase()
                          ? "#800020"
                          : "#9A9A9A",
                    }}
                  >
                    {step}
                  </p>
                </div>
                {index < 2 && (
                  <div
                    className="h-0.5 w-20 mx-4"
                    style={{
                      backgroundColor:
                        index < ["upload", "validate", "confirm"].indexOf(currentStep)
                          ? "#800020"
                          : "#E5E5E7",
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Upload */}
      {currentStep === "upload" && (
        <Card style={{ borderColor: "#E5E5E7" }}>
          <CardContent className="p-6 space-y-6">
            <div>
              <Label htmlFor="plevel">Select P-Level</Label>
              <Select value={selectedPLevel} onValueChange={setSelectedPLevel}>
                <SelectTrigger className="w-full h-11 mt-2">
                  <SelectValue placeholder="Select P-Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="P1">P1</SelectItem>
                  <SelectItem value="P2">P2</SelectItem>
                  <SelectItem value="P3">P3</SelectItem>
                  <SelectItem value="P4">P4</SelectItem>
                  <SelectItem value="P5">P5</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Upload Excel File</Label>
              <div
                className="mt-2 border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ borderColor: "#E5E5E7" }}
                onClick={() => document.getElementById("file-input")?.click()}
              >
                <input
                  id="file-input"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {selectedFile ? (
                  <div className="space-y-2">
                    <FileSpreadsheet size={48} className="mx-auto" style={{ color: "#1A7F4B" }} />
                    <p className="font-medium" style={{ color: "#2C2C2C" }}>
                      {selectedFile.name}
                    </p>
                    <p className="text-sm" style={{ color: "#9A9A9A" }}>
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload size={48} className="mx-auto" style={{ color: "#C9A84C" }} />
                    <p className="font-medium" style={{ color: "#2C2C2C" }}>
                      Drop your .xlsx file here or click to browse
                    </p>
                    <p className="text-sm" style={{ color: "#9A9A9A" }}>
                      Accepted format: .xlsx — Max size: 5MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={handleUploadAndValidate}
              disabled={!selectedPLevel || !selectedFile}
              className="w-full h-11"
              style={{ backgroundColor: "#800020", color: "#FFFFFF" }}
            >
              Upload & Validate
              <ArrowRight size={18} className="ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Validate */}
      {currentStep === "validate" && (
        <Card style={{ borderColor: "#E5E5E7" }}>
          <CardContent className="p-6">
            {isValidating ? (
              <div className="text-center py-12">
                <div className="animate-spin w-12 h-12 border-4 border-gray-200 rounded-full mx-auto mb-4" style={{ borderTopColor: "#800020" }} />
                <p className="font-medium" style={{ color: "#2C2C2C" }}>
                  Validating your file...
                </p>
              </div>
            ) : validationResult?.success ? (
              <div className="space-y-6">
                <div className="text-center">
                  <CheckCircle size={64} className="mx-auto mb-4" style={{ color: "#1A7F4B" }} />
                  <h3 className="text-xl font-semibold mb-2" style={{ color: "#2C2C2C" }}>
                    File validated successfully
                  </h3>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span style={{ color: "#9A9A9A" }}>P-Level:</span>
                    <span className="font-semibold" style={{ color: "#2C2C2C" }}>
                      {validationResult.pLevel}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "#9A9A9A" }}>Sheets detected:</span>
                    <span className="font-semibold" style={{ color: "#2C2C2C" }}>
                      {validationResult.sheets.join(", ")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "#9A9A9A" }}>Total students:</span>
                    <span className="font-semibold" style={{ color: "#2C2C2C" }}>
                      {validationResult.totalStudents}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleUploadDifferentFile}
                    variant="ghost"
                    className="flex-1"
                  >
                    Upload Different File
                  </Button>
                  <Button
                    onClick={handleConfirmImport}
                    className="flex-1 h-11"
                    style={{ backgroundColor: "#800020", color: "#FFFFFF" }}
                  >
                    Confirm Import
                    <ArrowRight size={18} className="ml-2" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <XCircle size={64} className="mx-auto mb-4" style={{ color: "#C0392B" }} />
                  <h3 className="text-xl font-semibold mb-2" style={{ color: "#2C2C2C" }}>
                    Validation failed
                  </h3>
                </div>

                <div className="bg-red-50 rounded-lg p-4 space-y-2">
                  {validationResult?.errors?.map((error, index) => (
                    <div key={index} className="text-sm">
                      <span className="font-semibold" style={{ color: "#C0392B" }}>
                        {error.sheet}, Row {error.row}:
                      </span>{" "}
                      <span style={{ color: "#2C2C2C" }}>{error.error}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={handleUploadDifferentFile}
                  variant="ghost"
                  className="w-full"
                >
                  Upload Different File
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
