import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowRight, ArrowLeft, ArrowRightLeft, BarChart3, Shuffle } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import { Label } from "../../components/ui/label";

type Algorithm = "round-robin" | "balanced-bands" | "snake-draft";

const algorithms = [
  {
    id: "round-robin" as Algorithm,
    name: "Round Robin",
    description: "Students distributed in rotating order: 1→A, 2→B, 3→C, 4→A...",
    icon: ArrowRightLeft,
    color: "#001F5B",
  },
  {
    id: "balanced-bands" as Algorithm,
    name: "Balanced Bands",
    description: "Students split into Top, Middle, Bottom thirds — each class gets equal mix",
    icon: BarChart3,
    color: "#800020",
    recommended: true,
  },
  {
    id: "snake-draft" as Algorithm,
    name: "Snake Draft",
    description: "Forward then reverse: 1→A, 2→B, 3→C, then 4→C, 5→B, 6→A...",
    icon: Shuffle,
    color: "#C9A84C",
  },
];

export function AlgorithmSelection() {
  const { pLevel } = useParams<{ pLevel: string }>();
  const navigate = useNavigate();
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<Algorithm | null>(null);

  const handleRunAlgorithm = () => {
    if (selectedAlgorithm) {
      navigate(`/dean/preview/${pLevel}?algorithm=${selectedAlgorithm}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/dean/import")}
          style={{ color: "#800020" }}
        >
          <ArrowLeft size={18} className="mr-2" />
          Back to Import
        </Button>
      </div>

      <div className="text-center">
        <h1 className="text-2xl font-semibold" style={{ color: "#2C2C2C" }}>
          Select Shuffle Algorithm — {pLevel}
        </h1>
        <p className="text-sm mt-2" style={{ color: "#9A9A9A" }}>
          Choose how students will be distributed into new classes
        </p>
      </div>

      <RadioGroup value={selectedAlgorithm || ""} onValueChange={(value) => setSelectedAlgorithm(value as Algorithm)}>
        <div className="space-y-4">
          {algorithms.map((algorithm) => {
            const Icon = algorithm.icon;
            const isSelected = selectedAlgorithm === algorithm.id;

            return (
              <Card
                key={algorithm.id}
                className="cursor-pointer transition-all hover:shadow-md"
                style={{
                  borderColor: isSelected ? "#800020" : "#E5E5E7",
                  borderWidth: isSelected ? "2px" : "1px",
                }}
                onClick={() => setSelectedAlgorithm(algorithm.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <RadioGroupItem value={algorithm.id} id={algorithm.id} />
                    </div>

                    <div
                      className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${algorithm.color}20` }}
                    >
                      <Icon size={32} style={{ color: algorithm.color }} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Label htmlFor={algorithm.id} className="text-xl font-semibold cursor-pointer" style={{ color: "#2C2C2C" }}>
                          {algorithm.name}
                        </Label>
                        {algorithm.recommended && (
                          <span
                            className="px-2 py-1 rounded text-xs font-semibold"
                            style={{ backgroundColor: "#C9A84C", color: "#2C2C2C" }}
                          >
                            Recommended
                          </span>
                        )}
                      </div>
                      <p style={{ color: "#9A9A9A" }}>{algorithm.description}</p>

                      {/* Visual pattern example */}
                      <div className="mt-4 flex items-center gap-2">
                        {algorithm.id === "round-robin" && (
                          <>
                            {["A", "B", "C", "A", "B", "C"].map((label, i) => (
                              <div
                                key={i}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                                style={{
                                  backgroundColor:
                                    label === "A" ? "#800020" :
                                    label === "B" ? "#001F5B" : "#C9A84C",
                                }}
                              >
                                {label}
                              </div>
                            ))}
                          </>
                        )}
                        {algorithm.id === "balanced-bands" && (
                          <div className="space-y-1">
                            {["Top", "Mid", "Bot"].map((band, i) => (
                              <div key={band} className="flex gap-1">
                                {["A", "B", "C"].map((cls) => (
                                  <div
                                    key={cls}
                                    className="w-12 h-6 rounded flex items-center justify-center text-xs font-semibold text-white"
                                    style={{
                                      backgroundColor:
                                        i === 0 ? "#1A7F4B" :
                                        i === 1 ? "#D97706" : "#C0392B",
                                      opacity: 0.8,
                                    }}
                                  >
                                    {cls}
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                        {algorithm.id === "snake-draft" && (
                          <>
                            {["A", "B", "C", "C", "B", "A"].map((label, i) => (
                              <div key={i} className="flex flex-col items-center">
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                                  style={{
                                    backgroundColor:
                                      label === "A" ? "#800020" :
                                      label === "B" ? "#001F5B" : "#C9A84C",
                                  }}
                                >
                                  {label}
                                </div>
                                {i < 5 && (
                                  <div className="text-xs mt-1" style={{ color: "#9A9A9A" }}>
                                    {i === 2 ? "⤵" : "→"}
                                  </div>
                                )}
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </RadioGroup>

      <Card style={{ borderColor: "#E5E5E7", backgroundColor: "#F4F4F6" }}>
        <CardContent className="p-4">
          <p className="text-sm" style={{ color: "#9A9A9A" }}>
            <strong style={{ color: "#2C2C2C" }}>Note:</strong> Tied students are distributed in their Excel sheet order
          </p>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          variant="ghost"
          onClick={() => navigate("/dean/import")}
          className="flex-1 h-11"
        >
          Back to Import
        </Button>
        <Button
          onClick={handleRunAlgorithm}
          disabled={!selectedAlgorithm}
          className="flex-1 h-11"
          style={{ backgroundColor: "#800020", color: "#FFFFFF" }}
        >
          Run Algorithm
          <ArrowRight size={18} className="ml-2" />
        </Button>
      </div>
    </div>
  );
}
