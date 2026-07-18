import React, { useState, useRef } from "react";
import { 
  X, 
  Lock, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Sparkles, 
  Database,
  Upload,
  Image as ImageIcon,
  AlertTriangle,
  Crop,
  RotateCcw
} from "lucide-react";
import { Product } from "../types";
import { EXAMPLE_PRODUCTS } from "../data";

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSaveProducts: (products: Product[]) => void;
  showToast: (msg: string) => void;
}

// Utility function to resize and compress base64 images to prevent 413 Payload Too Large / HTML response errors
const resizeImage = (base64Str: string, maxDimension: number = 1024): Promise<string> => {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // No compression - Use lossless PNG to preserve absolute detail and quality
            const resizedBase64 = canvas.toDataURL("image/png");
            resolve(resizedBase64);
          } else {
            resolve(base64Str);
          }
        } catch (innerErr) {
          console.error("Erro interno no redimensionamento de imagem:", innerErr);
          resolve(base64Str);
        }
      };
      img.onerror = () => {
        resolve(base64Str);
      };
      img.src = base64Str;
    } catch (err) {
      console.error("Erro no manipulador de redimensionamento:", err);
      resolve(base64Str);
    }
  });
};

const cropImageCanvas = (
  base64Str: string,
  crop: { x: number; y: number; width: number; height: number }
): Promise<string> => {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          
          // Convert percentage positions to actual pixels
          const sourceX = (img.width * crop.x) / 100;
          const sourceY = (img.height * crop.y) / 100;
          const sourceW = (img.width * crop.width) / 100;
          const sourceH = (img.height * crop.height) / 100;

          // Avoid division by zero or negative size
          const targetW = sourceW > 0 ? sourceW : 100;
          const targetH = sourceH > 0 ? sourceH : 100;

          canvas.width = targetW;
          canvas.height = targetH;

          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, sourceX, sourceY, sourceW, sourceH, 0, 0, targetW, targetH);
            // Lossless - Use PNG format to prevent compression artifacting
            resolve(canvas.toDataURL("image/png"));
          } else {
            resolve(base64Str);
          }
        } catch (innerErr) {
          console.error("Erro interno ao cortar imagem:", innerErr);
          resolve(base64Str);
        }
      };
      img.onerror = () => {
        resolve(base64Str);
      };
      img.src = base64Str;
    } catch (err) {
      console.error("Erro no manipulador de recorte:", err);
      resolve(base64Str);
    }
  });
};

const enhanceImageAction = async (
  base64Str: string,
  level: "soft" | "medium" | "ultra",
  upscale2x: boolean
): Promise<string> => {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Apply 2x Upscale if selected
          if (upscale2x) {
            width = width * 2;
            height = height * 2;
            // Keep it within standard limits (max 2048px to prevent heavy memory/payload errors)
            if (width > 2048 || height > 2048) {
              const ratio = Math.min(2048 / width, 2048 / height);
              width = Math.round(width * ratio);
              height = Math.round(height * ratio);
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(base64Str);
            return;
          }

          // Configure high-quality image smoothing for the upscale interpolation
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";

          // Apply subtle lighting/color improvements via Canvas context filter
          let contrast = 1.0;
          let saturate = 1.0;
          let brightness = 1.0;

          if (level === "soft") {
            contrast = 1.05;
            saturate = 1.03;
            brightness = 1.02;
          } else if (level === "medium") {
            contrast = 1.10;
            saturate = 1.07;
            brightness = 1.03;
          } else if (level === "ultra") {
            contrast = 1.18;
            saturate = 1.12;
            brightness = 1.04;
          }

          ctx.filter = `contrast(${contrast}) saturate(${saturate}) brightness(${brightness})`;
          ctx.drawImage(img, 0, 0, width, height);

          // Now grab the imageData to apply pixel-level high-frequency sharpening convolution!
          try {
            const imgData = ctx.getImageData(0, 0, width, height);
            
            let sharpenAmount = 0.0;
            if (level === "soft") sharpenAmount = 0.12;
            else if (level === "medium") sharpenAmount = 0.25;
            else if (level === "ultra") sharpenAmount = 0.45;

            if (sharpenAmount > 0) {
              // Perform 3x3 sharpening convolution
              const input = imgData.data;
              const output = new Uint8ClampedArray(input.length);
              const w = imgData.width;
              const h = imgData.height;
              const a = sharpenAmount;
              const centerWeight = 1 + 4 * a;
              const edgeWeight = -a;

              // Copy alphas directly
              for (let i = 3; i < input.length; i += 4) {
                output[i] = input[i];
              }

              for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                  const idx = (y * w + x) * 4;
                  
                  for (let c = 0; c < 3; c++) {
                    const currentIdx = idx + c;
                    const top = y > 0 ? input[((y - 1) * w + x) * 4 + c] : input[currentIdx];
                    const bottom = y < h - 1 ? input[((y + 1) * w + x) * 4 + c] : input[currentIdx];
                    const left = x > 0 ? input[(y * w + x - 1) * 4 + c] : input[currentIdx];
                    const right = x < w - 1 ? input[(y * w + x + 1) * 4 + c] : input[currentIdx];
                    const center = input[currentIdx];

                    const val = center * centerWeight + (top + bottom + left + right) * edgeWeight;
                    output[currentIdx] = val < 0 ? 0 : (val > 255 ? 255 : val);
                  }
                }
              }

              // Write back to imgData
              imgData.data.set(output);
              ctx.putImageData(imgData, 0, 0);
            }
          } catch (pixelErr) {
            console.warn("Filtro de pixel avançado ignorado (imagem sem CORS habilitado ou erro de suporte):", pixelErr);
            // We still have the contrast/saturate/brightness applied directly via context filter, so we continue!
          }

          // Lossless - Return PNG format to preserve maximum visual detail, sharp edges, and pixel accuracy with no compression
          try {
            resolve(canvas.toDataURL("image/png"));
          } catch (toDataUrlErr) {
            console.warn("toDataURL falhou devido a restrições de segurança de origem da imagem externa. Retornando imagem original.");
            resolve(base64Str);
          }
        } catch (innerErr) {
          console.error("Erro interno ao melhorar imagem:", innerErr);
          resolve(base64Str);
        }
      };
      img.onerror = (err) => {
        console.error("Erro no carregamento do arquivo de imagem:", err);
        resolve(base64Str);
      };
      img.src = base64Str;
    } catch (err) {
      console.error("Erro no manipulador de realce de imagem:", err);
      resolve(base64Str);
    }
  });
};

export default function AdminModal({
  isOpen,
  onClose,
  products,
  onSaveProducts,
  showToast
}: AdminModalProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");
  const [loginError, setLoginError] = useState<string>("");

  // Product Form states
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState<string>("");
  const [formCategory, setFormCategory] = useState<"Lingerie" | "Sex Shop">("Lingerie");
  const [formPrice, setFormPrice] = useState<string>("");
  const [formDescription, setFormDescription] = useState<string>("");
  const [formImage, setFormImage] = useState<string>("");
  const [formImages, setFormImages] = useState<string[]>([]);
  const [formSizes, setFormSizes] = useState<string>("P, M, G, GG");
  const [formColors, setFormColors] = useState<string>("Preto Absoluto, Vermelho Sensual");
  const [formDetails, setFormDetails] = useState<string>("Material importado de alta qualidade, Toque macio e confortável");
  const [formTag, setFormTag] = useState<string>("");

  // Image Cropping States & Refs
  const [originalUncroppedImage, setOriginalUncroppedImage] = useState<string>("");
  const [isCropperOpen, setIsCropperOpen] = useState<boolean>(false);
  const [cropBoxState, setCropBoxState] = useState<{ x: number, y: number, width: number, height: number }>({ x: 10, y: 10, width: 80, height: 80 });
  const [isAutoCropped, setIsAutoCropped] = useState<boolean>(false);
  const [lockedRatio, setLockedRatio] = useState<"free" | "1:1" | "3:4">("free");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number, y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Image Enhancement States
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  const [isEnhancerOpen, setIsEnhancerOpen] = useState<boolean>(false);
  const [enhancementLevel, setEnhancementLevel] = useState<"soft" | "medium" | "ultra">("medium");
  const [upscale2x, setUpscale2x] = useState<boolean>(true);
  const [enhancedPreviewImage, setEnhancedPreviewImage] = useState<string>("");
  const [isProcessingEnhance, setIsProcessingEnhance] = useState<boolean>(false);

  const handleOpenEnhancer = async () => {
    const targetImg = editingImageIndex !== null && editingImageIndex !== -1 ? formImages[editingImageIndex] : formImage;
    if (!targetImg) return;
    setIsProcessingEnhance(true);
    setEnhancedPreviewImage("");
    setIsEnhancerOpen(true);
    try {
      const result = await enhanceImageAction(targetImg, enhancementLevel, upscale2x);
      setEnhancedPreviewImage(result);
    } catch (err) {
      console.error(err);
      setEnhancedPreviewImage(targetImg);
    } finally {
      setIsProcessingEnhance(false);
    }
  };

  const handleUpdateEnhancementPreview = async (level: "soft" | "medium" | "ultra", upscale: boolean) => {
    const targetImg = editingImageIndex !== null && editingImageIndex !== -1 ? formImages[editingImageIndex] : formImage;
    if (!targetImg) return;
    setIsProcessingEnhance(true);
    try {
      const result = await enhanceImageAction(targetImg, level, upscale);
      setEnhancedPreviewImage(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingEnhance(false);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Bound to [0, 100]
    const boundedX = Math.max(0, Math.min(100, x));
    const boundedY = Math.max(0, Math.min(100, y));

    setIsDragging(true);
    setDragStart({ x: boundedX, y: boundedY });
    setCropBoxState({
      x: boundedX,
      y: boundedY,
      width: 0,
      height: 0
    });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStart || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currentX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const currentY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    const x = Math.min(dragStart.x, currentX);
    const y = Math.min(dragStart.y, currentY);
    let width = Math.abs(currentX - dragStart.x);
    let height = Math.abs(currentY - dragStart.y);

    if (lockedRatio === "1:1") {
      const size = Math.max(width, height);
      width = size;
      height = size;
    } else if (lockedRatio === "3:4") {
      const targetHeight = width * (4 / 3);
      if (y + targetHeight <= 100) {
        height = targetHeight;
      } else {
        width = (100 - y) * (3 / 4);
        height = 100 - y;
      }
    }

    const finalX = Math.max(0, Math.min(100 - width, x));
    const finalY = Math.max(0, Math.min(100 - height, y));
    const finalW = Math.min(100 - finalX, width);
    const finalH = Math.min(100 - finalY, height);

    setCropBoxState({
      x: finalX,
      y: finalY,
      width: finalW,
      height: finalH
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    setDragStart(null);
    e.currentTarget.releasePointerCapture(e.pointerId);

    setCropBoxState(prev => {
      if (prev.width < 5 || prev.height < 5) {
        return { x: 10, y: 10, width: 80, height: 80 };
      }
      return prev;
    });
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const aiRefInputRef = useRef<HTMLInputElement>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<"catalog" | "ai">("catalog");

  // Action Confirmation States
  const [confirmClearAll, setConfirmClearAll] = useState<boolean>(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // AI Ad Scan States
  const [scanLoading, setScanLoading] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string>("");
  const [scanStep, setScanStep] = useState<string>("Analisando imagem...");

  React.useEffect(() => {
    if (!scanLoading) {
      setScanStep("IA Analisando Anúncio...");
      return;
    }
    const steps = [
      "Compactando imagem para envio ultrarrápido...",
      "Processando imagem com o Gemini 3.5 Flash...",
      "Identificando a peça e lendo textos do anúncio...",
      "Extraindo preço, categoria e marca de luxo...",
      "Gerando descrição e detalhes requintados...",
      "Calculando recorte inteligente focado na peça...",
      "Organizando as cores e tamanhos sugeridos..."
    ];
    let currentIdx = 0;
    setScanStep(steps[0]);
    const timer = setInterval(() => {
      currentIdx = (currentIdx + 1) % steps.length;
      setScanStep(steps[currentIdx]);
    }, 1800);
    return () => clearInterval(timer);
  }, [scanLoading]);

  const handleAiAdScan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showToast("Por favor, selecione uma imagem de anúncio menor que 10MB.");
        return;
      }
      setScanLoading(true);
      setScanError("");
      const reader = new FileReader();
      reader.onloadend = async () => {
        if (typeof reader.result === "string") {
          try {
            // Resize to 720px to make uploading 2x faster while keeping perfect OCR and vision readability
            const base64Data = await resizeImage(reader.result, 720);
            const response = await fetch("/api/ai/parse-product", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ image: base64Data }),
            });

            let data: any = {};
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              data = await response.json();
            } else {
              const text = await response.text();
              const isHtml = text.trim().startsWith("<");
              const cleanText = isHtml ? "Resposta inválida do servidor (HTML). Verifique se o servidor está ativo." : text;
              throw new Error(cleanText || `Erro ${response.status} do servidor.`);
            }

            if (!response.ok) {
              throw new Error(data.error || "Não foi possível analisar o anúncio.");
            }

            // Fill states
            if (data.name) setFormName(data.name);
            if (data.category) {
              setFormCategory(data.category === "Sex Shop" ? "Sex Shop" : "Lingerie");
            }
            if (data.price !== undefined) {
              setFormPrice(data.price.toString());
            }
            if (data.description) setFormDescription(data.description);
            if (Array.isArray(data.sizes)) {
              setFormSizes(data.sizes.join(", "));
            }
            if (Array.isArray(data.colors)) {
              setFormColors(data.colors.join(", "));
            }
            if (Array.isArray(data.details)) {
              setFormDetails(data.details.join(", "));
            }
            if (data.tag) {
              setFormTag(data.tag);
            } else {
              setFormTag("");
            }
            
            // Save the original full advertisement photo so the user can edit or restore
            setOriginalUncroppedImage(base64Data);

            // Set the uploaded advertisement image as the product photo, and try automatic cropping if cropBox is returned
            if (data.cropBox && typeof data.cropBox === "object") {
              const { x, y, width, height } = data.cropBox;
              if (width > 0 && height > 0) {
                try {
                  const cropped = await cropImageCanvas(base64Data, { x, y, width, height });
                  setFormImage(cropped);
                  setCropBoxState({ x, y, width, height });
                  setIsAutoCropped(true);
                  showToast("✨ Cadastro preenchido e foto recortada automaticamente focando no produto!");
                } catch (cropErr) {
                  console.error("Falha no recorte automático da IA:", cropErr);
                  setFormImage(base64Data);
                  setCropBoxState({ x: 10, y: 10, width: 80, height: 80 });
                  setIsAutoCropped(false);
                  showToast("✨ Cadastro preenchido automaticamente pela IA!");
                }
              } else {
                setFormImage(base64Data);
                setCropBoxState({ x: 10, y: 10, width: 80, height: 80 });
                setIsAutoCropped(false);
                showToast("✨ Cadastro preenchido automaticamente pela IA!");
              }
            } else {
              setFormImage(base64Data);
              setCropBoxState({ x: 10, y: 10, width: 80, height: 80 });
              setIsAutoCropped(false);
              showToast("✨ Cadastro preenchido automaticamente pela IA!");
            }
          } catch (err: any) {
            console.error(err);
            setScanError(err.message || "Erro ao processar imagem do anúncio. Verifique a chave do Gemini.");
            showToast("Erro ao processar o anúncio.");
          } finally {
            setScanLoading(false);
          }
        }
      };
      reader.onerror = () => {
        showToast("Erro ao ler o arquivo de imagem.");
        setScanLoading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // AI Studio states
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [aiMode, setAiMode] = useState<"generate" | "edit">("generate");
  const [aiRefImage, setAiRefImage] = useState<string>("");
  const [aiAspectRatio, setAiAspectRatio] = useState<string>("1:1");
  const [aiResultImage, setAiResultImage] = useState<string>("");
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string>("");

  const handleAiRefChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        showToast("Por favor, selecione uma imagem menor que 3MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        if (typeof reader.result === "string") {
          try {
            const compressed = await resizeImage(reader.result, 1024);
            setAiRefImage(compressed);
            showToast("Imagem de referência carregada!");
          } catch (err) {
            setAiRefImage(reader.result);
            showToast("Imagem de referência carregada!");
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateAiImage = async () => {
    if (!aiPrompt.trim()) {
      showToast("Por favor, digite uma descrição (prompt) para a IA.");
      return;
    }
    setAiLoading(true);
    setAiError("");
    try {
      const response = await fetch("/api/ai/image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: aiPrompt,
          image: aiMode === "edit" ? aiRefImage : undefined,
          aspectRatio: aiAspectRatio,
        }),
      });

      let data: any = {};
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        const isHtml = text.trim().startsWith("<");
        const cleanText = isHtml ? "Resposta inválida do servidor (HTML). Verifique se o servidor está ativo." : text;
        throw new Error(cleanText || `Erro ${response.status} do servidor.`);
      }

      if (!response.ok) {
        throw new Error(data.error || "Erro ao processar imagem.");
      }

      setAiResultImage(data.image);
      showToast("Imagem gerada com sucesso pela Inteligência Artificial!");
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "Não foi possível gerar a imagem. Verifique a chave da API do Gemini.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileList = Array.from(files);
      showToast(`Processando ${fileList.length} imagem(ns)...`);

      Promise.all(fileList.map((file: File) => {
        return new Promise<string>((resolve, reject) => {
          if (file.size > 8 * 1024 * 1024) {
            showToast(`A imagem ${file.name} é muito grande. Escolha fotos menores que 8MB.`);
            reject(new Error("File too large"));
            return;
          }
          const reader = new FileReader();
          reader.onloadend = async () => {
            if (typeof reader.result === "string") {
              try {
                const compressed = await resizeImage(reader.result, 1024);
                resolve(compressed);
              } catch (err) {
                resolve(reader.result);
              }
            } else {
              reject(new Error("Read error"));
            }
          };
          reader.onerror = () => reject(new Error("File reading error"));
          reader.readAsDataURL(file);
        });
      })).then((results) => {
        const validResults = results.filter((res): res is string => typeof res === "string" && !!res);
        if (validResults.length > 0) {
          setFormImages((prev) => {
            const updated = [...prev];
            validResults.forEach(res => {
              if (!updated.includes(res)) {
                updated.push(res);
              }
            });
            return updated;
          });

          setFormImage((current) => {
            if (!current) {
              setOriginalUncroppedImage(validResults[0]);
              setCropBoxState({ x: 10, y: 10, width: 80, height: 80 });
              return validResults[0];
            }
            return current;
          });

          showToast("Imagem(ns) carregada(s) com sucesso!");
        }
      }).catch((err) => {
        console.error("Erro no upload múltiplo:", err);
      });
    }
  };

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "241003") {
      setIsAuthenticated(true);
      setLoginError("");
      showToast("Painel Administrativo Desbloqueado!");
    } else {
      setLoginError("Senha incorreta. Tente novamente.");
    }
  };

  const handleImportExamples = () => {
    onSaveProducts(EXAMPLE_PRODUCTS);
    showToast("Produtos de demonstração carregados com sucesso!");
  };

  const handleClearAll = () => {
    if (confirmClearAll) {
      onSaveProducts([]);
      showToast("Todos os produtos foram removidos.");
      setConfirmClearAll(false);
    } else {
      setConfirmClearAll(true);
      setTimeout(() => {
        setConfirmClearAll(false);
      }, 3500);
      showToast("Clique novamente no botão de lixeira para confirmar a remoção de tudo.");
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormName("");
    setFormCategory("Lingerie");
    setFormPrice("");
    setFormDescription("");
    setFormImage("");
    setFormImages([]);
    setFormSizes("P, M, G, GG");
    setFormColors("Preto Absoluto, Vermelho Sensual");
    setFormDetails("Material importado de alta qualidade, Toque macio e confortável");
    setFormTag("");
  };

  const handleEditClick = (product: Product) => {
    setIsEditing(true);
    setEditingId(product.id);
    setFormName(product.name);
    setFormCategory(product.category as "Lingerie" | "Sex Shop");
    setFormPrice(product.price.toString());
    setFormDescription(product.description);
    setFormImage(product.image);
    setFormImages(product.images && product.images.length > 0 ? product.images : [product.image]);
    setFormSizes(product.sizes.join(", "));
    setFormColors(product.colors.join(", "));
    setFormDetails(product.details.join(", "));
    setFormTag(product.tag || "");
  };

  const handleDeleteClick = (productId: string) => {
    if (confirmDeleteId === productId) {
      const updated = products.filter(p => p.id !== productId);
      onSaveProducts(updated);
      showToast("Produto excluído com sucesso.");
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(productId);
      setTimeout(() => {
        setConfirmDeleteId(prev => prev === productId ? null : prev);
      }, 3500);
      showToast("Clique novamente no botão de lixeira para confirmar a exclusão.");
    }
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPrice) {
      showToast("Preencha o nome e preço do produto.");
      return;
    }

    const finalImages = formImages.length > 0 ? formImages : (formImage ? [formImage] : []);
    const mainImage = formImage || finalImages[0] || "https://images.unsplash.com/photo-1618220179428-22790b461013?w=600&auto=format&fit=crop&q=80";

    const newProduct: Product = {
      id: editingId || `prod-${Date.now()}`,
      name: formName,
      category: formCategory,
      price: parseFloat(formPrice) || 0,
      description: formDescription,
      image: mainImage,
      images: finalImages.length > 0 ? finalImages : [mainImage],
      rating: isEditing ? (products.find(p => p.id === editingId)?.rating || 5.0) : 5.0,
      reviewsCount: isEditing ? (products.find(p => p.id === editingId)?.reviewsCount || 1) : 1,
      sizes: formSizes.split(",").map(s => s.trim()).filter(Boolean),
      colors: formColors.split(",").map(c => c.trim()).filter(Boolean),
      details: formDetails.split(",").map(d => d.trim()).filter(Boolean),
      tag: formTag.trim() || undefined
    };

    let updatedList;
    if (isEditing && editingId) {
      updatedList = products.map(p => p.id === editingId ? newProduct : p);
      showToast("Produto atualizado com sucesso!");
    } else {
      updatedList = [newProduct, ...products];
      showToast("Produto cadastrado com sucesso!");
    }

    onSaveProducts(updatedList);
    resetForm();
  };

  // Quick unsplash image options helper
  const handleQuickImage = (keyword: string) => {
    const urls: Record<string, string> = {
      lingerie1: "https://images.unsplash.com/photo-1618220179428-22790b461013?w=600&auto=format&fit=crop&q=80",
      lingerie2: "https://images.unsplash.com/photo-1508427953056-b00b8d78ecf5?w=600&auto=format&fit=crop&q=80",
      lingerie3: "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&auto=format&fit=crop&q=80",
      sexshop1: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600&auto=format&fit=crop&q=80",
      sexshop2: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&auto=format&fit=crop&q=80",
      sexshop3: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=600&auto=format&fit=crop&q=80",
    };
    if (urls[keyword]) {
      setFormImage(urls[keyword]);
      setOriginalUncroppedImage(urls[keyword]);
      setIsAutoCropped(false);
      setCropBoxState({ x: 10, y: 10, width: 80, height: 80 });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-burgundy-950 border border-gold-600/25 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col text-stone-100 shadow-2xl overflow-hidden animate-in fade-in duration-250">
        
        {/* Header */}
        <div className="p-6 border-b border-burgundy-900/60 flex justify-between items-center bg-stone-950/45">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full border border-gold-400/40 bg-gradient-to-tr from-gold-500/20 to-burgundy-900/40 flex items-center justify-center text-gold-300">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-wide font-display text-gold-200">Painel do Administrador</h2>
              <p className="text-[10px] text-stone-400 uppercase tracking-widest font-semibold">Área Secreta de Controle de Catálogo</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Barrier */}
        {!isAuthenticated ? (
          <div className="flex-1 p-8 flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-6">
            <div className="w-14 h-14 bg-stone-900 border border-stone-850 rounded-full flex items-center justify-center text-gold-400">
              <Lock className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-md font-bold font-display text-stone-200">Acesso Restrito</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Esta é uma seção secreta para administradores. Digite a senha para continuar e gerenciar os produtos.
              </p>
            </div>
            <form onSubmit={handleLogin} className="w-full space-y-3">
              <div className="space-y-1">
                <input 
                  type="password"
                  placeholder="Digite a senha de acesso"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-850 focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/30 rounded-xl px-4 py-3 text-xs text-stone-200 text-center placeholder-stone-600 focus:outline-none transition-all"
                  autoFocus
                />
                <span className="block text-[10px] text-stone-500 italic mt-1">Acesso exclusivo com a chave numérica de 6 dígitos</span>
              </div>
              {loginError && <p className="text-[11px] text-red-400">{loginError}</p>}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-gold-500 to-burgundy-600 hover:from-gold-400 hover:to-burgundy-500 text-white font-bold uppercase tracking-widest text-[11px] py-3 rounded-xl transition-all cursor-pointer shadow-lg"
              >
                Desbloquear Painel
              </button>
            </form>
          </div>
        ) : (
          /* Logged In Dashboard Content with Tabs */
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-stone-950/20">
            {/* Tab Header Navigation */}
            <div className="px-6 py-1 bg-stone-950/40 border-b border-burgundy-900/40 flex space-x-1 sm:space-x-4">
              <button
                type="button"
                onClick={() => setActiveTab("catalog")}
                className={`py-3 px-4 text-xs font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "catalog"
                    ? "border-gold-500 text-gold-300 bg-stone-900/20"
                    : "border-transparent text-stone-400 hover:text-stone-200"
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>Catálogo de Produtos</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("ai")}
                className={`py-3 px-4 text-xs font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "ai"
                    ? "border-gold-500 text-gold-300 bg-stone-900/20"
                    : "border-transparent text-stone-400 hover:text-stone-200"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-gold-400 animate-pulse" />
                <span>Estúdio de Imagem IA</span>
              </button>
            </div>

            {activeTab === "catalog" ? (
              <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row min-h-0">
                {/* Left side: Register/Edit Form */}
                <div className="w-full lg:w-1/2 p-6 lg:border-r border-burgundy-900/40 space-y-4 overflow-y-auto">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gold-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isEditing ? "Editar Produto" : "Cadastrar Novo Produto"}</span>
                  </h3>

                  {/* AI Scan Ad Autofill Option */}
                  {!isEditing && (
                    <div className="bg-stone-950/60 p-4 rounded-2xl border border-gold-500/15 space-y-3 shadow-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-gold-500/10 border border-gold-400/20 flex items-center justify-center text-gold-300">
                          <Sparkles className={`w-4 h-4 text-gold-400 ${scanLoading ? "animate-spin" : "animate-pulse"}`} />
                        </div>
                        <div>
                          <h4 className="text-[11px] font-bold text-stone-200 uppercase tracking-wide">Preencher com IA (Foto do Anúncio)</h4>
                          <p className="text-[9px] text-stone-400">Anexe a foto do anúncio/oferta com o preço para autopreencher</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input 
                          type="file"
                          id="ai-ad-uploader"
                          accept="image/*"
                          onChange={handleAiAdScan}
                          className="hidden"
                          disabled={scanLoading}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById("ai-ad-uploader")?.click()}
                          disabled={scanLoading}
                          className={`w-full py-3 px-4 rounded-xl border border-stone-850 hover:border-gold-500/30 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            scanLoading 
                              ? "bg-stone-900/50 text-stone-500 border-stone-900" 
                              : "bg-stone-950 hover:bg-stone-900 text-gold-400 hover:text-gold-300"
                          }`}
                        >
                          {scanLoading ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-gold-400" />
                              <span className="text-[11px] font-bold text-gold-400 animate-pulse">{scanStep}</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-3.5 h-3.5 text-gold-400" />
                              <span>Carregar Foto do Anúncio / Oferta</span>
                            </>
                          )}
                        </button>
                      </div>

                      {scanError && (
                        <p className="text-[10px] text-red-400 font-medium bg-red-950/20 p-2 rounded-lg border border-red-900/30">
                          {scanError}
                        </p>
                      )}
                    </div>
                  )}

                  <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
                    {/* Nome */}
                    <div className="space-y-1">
                      <label className="block text-stone-400 font-medium">Nome do Produto *</label>
                      <input 
                        type="text"
                        required
                        placeholder="Ex: Conjunto Belle Noite Renda"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className="w-full bg-stone-950 border border-stone-850 focus:border-gold-500/50 rounded-xl px-3 py-2 text-stone-200 focus:outline-none"
                      />
                    </div>

                    {/* Preço & Categoria */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-stone-400 font-medium">Preço (R$) *</label>
                        <input 
                          type="number"
                          step="0.01"
                          required
                          placeholder="189.90"
                          value={formPrice}
                          onChange={(e) => setFormPrice(e.target.value)}
                          className="w-full bg-stone-950 border border-stone-850 focus:border-gold-500/50 rounded-xl px-3 py-2 text-stone-200 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-stone-400 font-medium">Grupo/Categoria *</label>
                        <select 
                          value={formCategory}
                          onChange={(e) => setFormCategory(e.target.value as "Lingerie" | "Sex Shop")}
                          className="w-full bg-stone-950 border border-stone-850 focus:border-gold-500/50 rounded-xl px-3 py-2 text-stone-200 focus:outline-none"
                        >
                          <option value="Lingerie">Lingerie</option>
                          <option value="Sex Shop">Sex Shop</option>
                        </select>
                      </div>
                    </div>

                    {/* Descrição */}
                    <div className="space-y-1">
                      <label className="block text-stone-400 font-medium">Descrição Completa</label>
                      <textarea 
                        placeholder="Descreva os encantos e qualidades do produto..."
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        rows={2}
                        className="w-full bg-stone-950 border border-stone-850 focus:border-gold-500/50 rounded-xl p-3 text-stone-200 focus:outline-none resize-none"
                      />
                    </div>

                    {/* Imagens (Galeria do Produto) */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="block text-stone-400 font-medium flex items-center gap-1">
                          <ImageIcon className="w-3.5 h-3.5 text-gold-400" />
                          <span>Fotos do Produto (Galeria) *</span>
                        </label>
                        <span className="text-[10px] text-stone-500">Selecione uma ou mais fotos</span>
                      </div>

                      {/* Hidden Native File Input with multiple allowed */}
                      <input 
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        multiple
                        className="hidden"
                      />

                      {/* Gallery grid of uploaded photos */}
                      <div className="grid grid-cols-4 gap-2.5">
                        {formImages.map((imgUrl, index) => {
                          const isMain = imgUrl === formImage;
                          return (
                            <div 
                              key={index} 
                              className={`relative aspect-square rounded-xl overflow-hidden border bg-stone-900 group transition-all ${
                                isMain ? "border-gold-500 ring-1 ring-gold-500/40 scale-95" : "border-stone-800 hover:border-stone-600"
                              }`}
                            >
                              <img 
                                src={imgUrl} 
                                alt={`Foto ${index + 1}`} 
                                className="w-full h-full object-cover"
                              />
                              
                              {/* Overlay for action buttons */}
                              <div className="absolute inset-0 bg-stone-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5 z-10">
                                <div className="flex justify-between items-start">
                                  {/* Cover label or mark as cover */}
                                  {!isMain ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setFormImage(imgUrl);
                                        setOriginalUncroppedImage(imgUrl);
                                        setIsAutoCropped(false);
                                        setCropBoxState({ x: 10, y: 10, width: 80, height: 80 });
                                        showToast("Definida como imagem principal!");
                                      }}
                                      className="px-1.5 py-0.5 rounded-md bg-stone-900 hover:bg-gold-500 hover:text-stone-950 text-[8px] text-gold-300 font-bold transition-all cursor-pointer"
                                    >
                                      Capa
                                    </button>
                                  ) : (
                                    <span className="px-1.5 py-0.5 rounded-md bg-gold-500 text-stone-950 text-[8px] font-extrabold">
                                      Capa
                                    </span>
                                  )}

                                  {/* Delete button */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = formImages.filter((_, i) => i !== index);
                                      setFormImages(updated);
                                      if (isMain) {
                                        setFormImage(updated[0] || "");
                                      }
                                      showToast("Foto removida da galeria.");
                                    }}
                                    className="p-1 rounded-md bg-stone-900 hover:bg-red-900 text-stone-400 hover:text-white transition-all cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>

                                {/* Crop & Enhance buttons at the bottom of the hover overlay */}
                                <div className="flex justify-center gap-1 mt-auto">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingImageIndex(index);
                                      setOriginalUncroppedImage(imgUrl);
                                      setCropBoxState({ x: 10, y: 10, width: 80, height: 80 });
                                      setIsAutoCropped(false);
                                      setIsCropperOpen(true);
                                    }}
                                    className="p-1 rounded-md bg-stone-900 hover:bg-gold-500 text-gold-400 hover:text-stone-950 border border-stone-800 transition-all cursor-pointer flex items-center justify-center"
                                    title="Recortar esta foto individualmente"
                                  >
                                    <Crop className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      setEditingImageIndex(index);
                                      setIsProcessingEnhance(true);
                                      setEnhancedPreviewImage("");
                                      setIsEnhancerOpen(true);
                                      try {
                                        const result = await enhanceImageAction(imgUrl, enhancementLevel, upscale2x);
                                        setEnhancedPreviewImage(result);
                                      } catch (err) {
                                        console.error(err);
                                        setEnhancedPreviewImage(imgUrl);
                                      } finally {
                                        setIsProcessingEnhance(false);
                                      }
                                    }}
                                    className="p-1 rounded-md bg-stone-900 hover:bg-purple-500 text-purple-400 hover:text-stone-950 border border-stone-800 transition-all cursor-pointer flex items-center justify-center"
                                    title="Melhorar qualidade HD desta foto individualmente"
                                  >
                                    <Sparkles className="w-3 h-3 animate-pulse" />
                                  </button>
                                </div>
                              </div>

                              {/* Static badge for the main image when not hovered */}
                              {isMain && (
                                <div className="absolute bottom-1.5 left-1.5 px-1 py-0.5 rounded-md bg-gold-500/95 text-stone-950 text-[7px] font-extrabold tracking-wider uppercase z-5">
                                  Capa
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Button to add more inside the grid */}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="relative aspect-square rounded-xl border border-dashed border-stone-800 hover:border-gold-400/30 hover:bg-stone-900/40 flex flex-col items-center justify-center gap-1 text-stone-500 hover:text-stone-300 transition-all cursor-pointer"
                        >
                          <Plus className="w-5 h-5" />
                          <span className="text-[8px] uppercase tracking-widest font-extrabold">Nova Foto</span>
                        </button>
                      </div>

                      {/* URL insertion input option */}
                      <div className="flex gap-2 items-center bg-stone-950/40 p-2.5 rounded-xl border border-stone-850">
                        <input 
                          type="text"
                          id="new-photo-url-input"
                          placeholder="Adicionar foto por link (URL)..."
                          className="flex-1 bg-stone-950 border border-stone-850 rounded-lg px-2.5 py-1.5 text-[11px] text-stone-300 focus:outline-none focus:border-gold-500/40"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const input = e.currentTarget;
                              const val = input.value.trim();
                              if (val) {
                                setFormImages(prev => prev.includes(val) ? prev : [...prev, val]);
                                if (!formImage) {
                                  setFormImage(val);
                                }
                                input.value = "";
                                showToast("Foto via link adicionada!");
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById("new-photo-url-input") as HTMLInputElement;
                            const val = input?.value?.trim();
                            if (val) {
                              setFormImages(prev => prev.includes(val) ? prev : [...prev, val]);
                              if (!formImage) {
                                setFormImage(val);
                              }
                              input.value = "";
                              showToast("Foto via link adicionada!");
                            } else {
                              showToast("Cole o link da foto para adicionar.");
                            }
                          }}
                          className="bg-stone-900 hover:bg-stone-850 text-stone-300 hover:text-gold-300 border border-stone-800 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                        >
                          Adicionar Link
                        </button>
                      </div>

                      {/* Main cover tools like crop and enhance */}
                      {formImage && (
                        <div className="flex flex-wrap gap-2 pt-1 bg-stone-950/20 p-2 rounded-xl border border-stone-900">
                          <span className="text-[9px] text-stone-500 uppercase tracking-wider block w-full font-semibold">Ajustes para a capa selecionada:</span>
                          <button
                            type="button"
                            onClick={() => {
                              setIsCropperOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-gold-500/10 hover:bg-gold-500/20 text-gold-400 border border-gold-500/20 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                            title="Ajustar ou fazer um novo recorte na foto principal"
                          >
                            <Crop className="w-3.5 h-3.5" />
                            <span>Recortar Foto</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleOpenEnhancer}
                            className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                            title="Melhorar nitidez, cores e resolução (Upscale HD)"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                            <span>Melhorar Nitidez / HD</span>
                          </button>

                          {isAutoCropped && (
                            <button
                              type="button"
                              onClick={() => {
                                setFormImage(originalUncroppedImage);
                                setIsAutoCropped(false);
                                showToast("Foto restaurada para a original.");
                              }}
                              className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-850 text-stone-400 hover:text-stone-300 border border-stone-800 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                              title="Restaurar para a foto original inteira"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Restaurar Original</span>
                            </button>
                          )}
                        </div>
                      )}

                      {/* Manual URL option toggle if they prefer to paste URL */}
                      <div className="flex flex-col gap-1 pt-2 border-t border-stone-900">
                        <div className="flex justify-between items-center text-[10px] text-stone-500 pt-1">
                          <span>Ou selecione uma foto de teste rápida abaixo:</span>
                        </div>
                        {/* Quick image choices */}
                        <div className="flex flex-wrap gap-1.5">
                          <button 
                            type="button" 
                            onClick={() => {
                              handleQuickImage("lingerie1");
                              setFormImages(prev => prev.includes("https://images.unsplash.com/photo-1618220179428-22790b461013?w=600&auto=format&fit=crop&q=80") ? prev : [...prev, "https://images.unsplash.com/photo-1618220179428-22790b461013?w=600&auto=format&fit=crop&q=80"]);
                            }}
                            className="text-[9px] bg-stone-900 border border-stone-800 hover:border-gold-400/30 text-stone-400 hover:text-stone-200 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
                          >
                            Lingerie Renda
                          </button>
                          <button 
                            type="button" 
                            onClick={() => {
                              handleQuickImage("lingerie2");
                              setFormImages(prev => prev.includes("https://images.unsplash.com/photo-1508427953056-b00b8d78ecf5?w=600&auto=format&fit=crop&q=80") ? prev : [...prev, "https://images.unsplash.com/photo-1508427953056-b00b8d78ecf5?w=600&auto=format&fit=crop&q=80"]);
                            }}
                            className="text-[9px] bg-stone-900 border border-stone-800 hover:border-gold-400/30 text-stone-400 hover:text-stone-200 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
                          >
                            Veludo Sensual
                          </button>
                          <button 
                            type="button" 
                            onClick={() => {
                              handleQuickImage("sexshop1");
                              setFormImages(prev => prev.includes("https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600&auto=format&fit=crop&q=80") ? prev : [...prev, "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600&auto=format&fit=crop&q=80"]);
                            }}
                            className="text-[9px] bg-stone-900 border border-stone-800 hover:border-gold-400/30 text-stone-400 hover:text-stone-200 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
                          >
                            Vela Massagem
                          </button>
                          <button 
                            type="button" 
                            onClick={() => {
                              handleQuickImage("sexshop3");
                              setFormImages(prev => prev.includes("https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=600&auto=format&fit=crop&q=80") ? prev : [...prev, "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=600&auto=format&fit=crop&q=80"]);
                            }}
                            className="text-[9px] bg-stone-900 border border-stone-800 hover:border-gold-400/30 text-stone-400 hover:text-stone-200 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
                          >
                            Acessório Luna
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Atributos: Tamanhos, Cores e Destaque */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-stone-400 font-medium">Tamanhos (separados por vírgula)</label>
                        <input 
                          type="text"
                          placeholder="P, M, G, GG"
                          value={formSizes}
                          onChange={(e) => setFormSizes(e.target.value)}
                          className="w-full bg-stone-950 border border-stone-850 rounded-xl px-3 py-1.5 text-stone-200 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-stone-400 font-medium">Cores (separadas por vírgula)</label>
                        <input 
                          type="text"
                          placeholder="Preto, Vermelho"
                          value={formColors}
                          onChange={(e) => setFormColors(e.target.value)}
                          className="w-full bg-stone-950 border border-stone-850 rounded-xl px-3 py-1.5 text-stone-200 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-stone-400 font-medium">Tag Especial (Ex: Luxo, Novidade)</label>
                        <input 
                          type="text"
                          placeholder="Sem tag"
                          value={formTag}
                          onChange={(e) => setFormTag(e.target.value)}
                          className="w-full bg-stone-950 border border-stone-850 rounded-xl px-3 py-1.5 text-stone-200 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-stone-400 font-medium">Destaques (separados por vírgula)</label>
                        <input 
                          type="text"
                          placeholder="Exclusivo, Toque Macio"
                          value={formDetails}
                          onChange={(e) => setFormDetails(e.target.value)}
                          className="w-full bg-stone-950 border border-stone-850 rounded-xl px-3 py-1.5 text-stone-200 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Form Buttons */}
                    <div className="flex space-x-2 pt-2">
                      <button
                        type="submit"
                        className="flex-1 bg-gold-500 hover:bg-gold-400 text-burgundy-950 font-extrabold uppercase py-3 rounded-xl transition-all cursor-pointer text-center text-[10px] tracking-wider"
                      >
                        {isEditing ? "Salvar Alterações" : "Cadastrar Produto"}
                      </button>
                      {isEditing && (
                        <button
                          type="button"
                          onClick={resetForm}
                          className="bg-stone-900 border border-stone-850 text-stone-300 px-4 py-3 rounded-xl hover:bg-stone-800 transition-all text-[10px] tracking-wider uppercase cursor-pointer"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Right side: Catalog List */}
                <div className="w-full lg:w-1/2 p-6 flex flex-col space-y-4 overflow-y-auto bg-stone-950/20">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-gold-400">Produtos Cadastrados ({products.length})</h3>
                      <p className="text-[10px] text-stone-500">Estes produtos serão renderizados na loja.</p>
                    </div>
                    
                    {/* Demo Action helpers */}
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={handleImportExamples}
                        className="p-1.5 rounded-lg bg-gold-500/10 hover:bg-gold-500/20 border border-gold-400/20 text-gold-300 text-[10px] font-bold flex items-center space-x-1 transition-all cursor-pointer"
                        title="Preencher com produtos de demonstração para testes rápidos"
                      >
                        <RefreshCw className="w-3 h-3 animate-spin duration-1000" />
                        <span className="hidden sm:inline">Preencher Demonstração</span>
                      </button>
                      <button
                        onClick={handleClearAll}
                        className={`p-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                          confirmClearAll 
                            ? "bg-red-600 hover:bg-red-700 text-stone-100 border-red-500 animate-pulse px-2" 
                            : "bg-red-950/20 hover:bg-red-950/40 border-red-500/10 text-red-400"
                        }`}
                        title={confirmClearAll ? "Clique novamente para limpar tudo" : "Limpar todos os produtos"}
                      >
                        <Trash2 className="w-3 h-3" />
                        {confirmClearAll ? <span className="text-[9px]">Confirmar Limpeza?</span> : null}
                      </button>
                    </div>
                  </div>

                  {products.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3 bg-stone-950/35 border border-stone-900 rounded-2xl">
                      <div className="w-12 h-12 rounded-full bg-stone-900 flex items-center justify-center text-stone-600">
                        <Database className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-stone-400">Nenhum produto na loja</h4>
                        <p className="text-[11px] text-stone-600 max-w-xs mt-1">
                          Conforme solicitado, a loja está temporariamente vazia. Use o formulário à esquerda para cadastrar ou clique em "Preencher Demonstração" acima.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5 overflow-y-auto pr-1">
                      {products.map((p) => (
                        <div 
                          key={`admin-list-${p.id}`}
                          className="flex items-center justify-between bg-stone-950/45 p-3 rounded-xl border border-burgundy-900/20 hover:border-gold-400/20 transition-all text-xs"
                        >
                          <div className="flex items-center space-x-3 min-w-0">
                            <img 
                              src={p.image} 
                              alt={p.name} 
                              className="w-10 h-10 object-cover rounded-lg bg-stone-900 border border-stone-850"
                            />
                            <div className="min-w-0">
                              <h4 className="font-semibold text-stone-200 truncate pr-2" title={p.name}>{p.name}</h4>
                              <div className="flex items-center space-x-2 mt-0.5 text-[10px]">
                                <span className="px-1.5 py-0.5 rounded-full bg-burgundy-950 text-gold-300 font-bold border border-gold-400/20 uppercase tracking-wide">
                                  {p.category}
                                </span>
                                <span className="text-stone-400 font-semibold">
                                  {p.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1.5 flex-shrink-0">
                            <button
                              onClick={() => handleEditClick(p)}
                              className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-850 text-stone-400 hover:text-gold-300 border border-stone-850 transition-colors cursor-pointer"
                              title="Editar"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(p.id)}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                confirmDeleteId === p.id 
                                  ? "bg-red-600 hover:bg-red-700 text-stone-100 border-red-500 animate-pulse px-2" 
                                  : "bg-stone-900 hover:bg-stone-850 text-stone-400 hover:text-red-400 border-stone-850"
                              }`}
                              title={confirmDeleteId === p.id ? "Clique novamente para confirmar exclusão" : "Excluir"}
                            >
                              {confirmDeleteId === p.id ? (
                                <>
                                  <AlertTriangle className="w-3 h-3 text-stone-100" />
                                  <span className="text-[9px] font-bold text-stone-100">Excluir?</span>
                                </>
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* AI Image Studio Tab View */
              <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row min-h-0 text-stone-200 animate-in fade-in duration-200">
                
                {/* Left Side: Parameters & Configuration */}
                <div className="w-full lg:w-1/2 p-6 lg:border-r border-burgundy-900/40 space-y-5 overflow-y-auto">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-gold-300 font-display flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-gold-400 animate-pulse" />
                      <span>Agente Criador de Imagem IA</span>
                    </h3>
                    <p className="text-[11px] text-stone-400">
                      Gere fotos ultra-realistas ou edite imagens existentes com o poder do Gemini.
                    </p>
                  </div>

                  {/* Mode Selector Toggle */}
                  <div className="bg-stone-950 p-1 rounded-xl border border-stone-900 flex">
                    <button
                      type="button"
                      onClick={() => {
                        setAiMode("generate");
                        setAiError("");
                      }}
                      className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                        aiMode === "generate"
                          ? "bg-gold-500 text-burgundy-950 shadow-md animate-in fade-in duration-200"
                          : "text-stone-400 hover:text-stone-200"
                      }`}
                    >
                      Nova Geração (Texto)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAiMode("edit");
                        setAiError("");
                      }}
                      className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                        aiMode === "edit"
                          ? "bg-gold-500 text-burgundy-950 shadow-md animate-in fade-in duration-200"
                          : "text-stone-400 hover:text-stone-200"
                      }`}
                    >
                      Edição com IA (Imagem + Texto)
                    </button>
                  </div>

                  {/* Image to edit configuration (Only shown in Edit mode) */}
                  {aiMode === "edit" && (
                    <div className="space-y-3 bg-stone-950/40 p-4 rounded-xl border border-stone-900">
                      <div className="flex justify-between items-center">
                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-400">
                          Imagem de Referência
                        </label>
                        <span className="text-[9px] text-stone-500">Adicione uma foto base</span>
                      </div>

                      {/* Hidden file input for Reference Image */}
                      <input 
                        type="file"
                        ref={aiRefInputRef}
                        onChange={handleAiRefChange}
                        accept="image/*"
                        className="hidden"
                      />

                      {aiRefImage ? (
                        <div className="flex items-center space-x-3 bg-stone-950 p-2.5 rounded-lg border border-gold-500/10">
                          <img 
                            src={aiRefImage} 
                            alt="Referência" 
                            className="w-12 h-12 object-cover rounded border border-stone-850 bg-stone-900"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="block text-[9px] text-gold-400 uppercase tracking-widest font-bold">Base para Edição</span>
                            <p className="text-[9px] text-stone-500 truncate mt-0.5">
                              {aiRefImage.startsWith("data:") ? "Dispositivo local" : aiRefImage}
                            </p>
                          </div>
                          <div className="flex space-x-1">
                            <button
                              type="button"
                              onClick={() => aiRefInputRef.current?.click()}
                              className="px-2 py-1 bg-stone-900 rounded text-[9px] font-bold text-stone-300 hover:text-gold-300 border border-stone-800 cursor-pointer"
                            >
                              Alterar
                            </button>
                            <button
                              type="button"
                              onClick={() => setAiRefImage("")}
                              className="p-1 bg-stone-900 hover:bg-red-950/40 text-stone-400 hover:text-red-400 rounded border border-stone-800 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <button
                            type="button"
                            onClick={() => aiRefInputRef.current?.click()}
                            className="w-full py-4 bg-stone-950 hover:bg-stone-900/40 border border-dashed border-stone-800 hover:border-gold-400/30 rounded-xl flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer text-xs"
                          >
                            <Upload className="w-4 h-4 text-stone-400" />
                            <span className="font-bold text-stone-300">Carregar foto do celular ou Windows Explorer</span>
                          </button>

                          {products.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="block text-[10px] uppercase tracking-wider text-stone-500">Ou selecione de um produto da loja:</span>
                              <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
                                {products.slice(0, 6).map((p) => (
                                  <button
                                    key={`ai-select-ref-${p.id}`}
                                    type="button"
                                    onClick={() => {
                                      setAiRefImage(p.image);
                                      showToast(`Foto do produto "${p.name}" definida como referência!`);
                                    }}
                                    className="flex-shrink-0 w-10 h-10 rounded border border-stone-850 hover:border-gold-500/50 overflow-hidden relative cursor-pointer"
                                    title={`Usar foto do produto: ${p.name}`}
                                  >
                                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Prompt Text Area */}
                  <div className="space-y-1.5 text-xs">
                    <label className="block text-stone-400 font-bold uppercase tracking-wider">
                      {aiMode === "generate" ? "Descrição da Nova Imagem (Prompt) *" : "Instruções de Edição (Prompt) *"}
                    </label>
                    <textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder={
                        aiMode === "generate"
                          ? "Ex: Foto luxuosa de estúdio profissional com uma lingerie fina de renda preta repousando artisticamente sobre lençóis de seda burgundy, iluminação dramática, alta definição..."
                          : "Ex: Mude a cor da lingerie para vermelho carmim, aumente o contraste das sombras e coloque um fundo de estúdio profissional luxuoso."
                      }
                      rows={4}
                      className="w-full bg-stone-950 border border-stone-850 focus:border-gold-500/50 rounded-xl p-3 text-stone-200 placeholder-stone-600 focus:outline-none resize-none leading-relaxed"
                    />
                  </div>

                  {/* Aspect Ratio Selector (Only for creation) */}
                  {aiMode === "generate" && (
                    <div className="space-y-1.5 text-xs">
                      <label className="block text-stone-400 font-bold uppercase tracking-wider">Proporção da Imagem</label>
                      <div className="grid grid-cols-5 gap-1.5">
                        {[
                          { id: "1:1", label: "Quadrado", desc: "1:1" },
                          { id: "4:3", label: "Retrato", desc: "4:3" },
                          { id: "3:4", label: "Paisagem", desc: "3:4" },
                          { id: "16:9", label: "Wide", desc: "16:9" },
                          { id: "9:16", label: "Celular", desc: "9:16" },
                        ].map((ratio) => (
                          <button
                            key={ratio.id}
                            type="button"
                            onClick={() => setAiAspectRatio(ratio.id)}
                            className={`py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border cursor-pointer transition-all ${
                              aiAspectRatio === ratio.id
                                ? "bg-gold-500 border-gold-400 text-burgundy-950 font-extrabold"
                                : "bg-stone-950 border-stone-850 text-stone-400 hover:border-stone-800 hover:text-stone-200"
                            }`}
                          >
                            <span className="block">{ratio.label}</span>
                            <span className="block text-[8px] opacity-70">({ratio.desc})</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Prompt Quick Ideas (Templates) */}
                  <div className="space-y-2">
                    <span className="block text-[10px] uppercase tracking-wider text-stone-500">Fórmulas e Ideias Rápidas para Lingerie:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAiPrompt("Foto de estúdio de alta definição com uma lingerie luxuosa de renda fina e cetim vermelho sensual, deitada sobre mármore preto polido com luzes douradas suaves e reflexos românticos.");
                          showToast("Prompt de Renda Vermelha inserido!");
                        }}
                        className="p-2 bg-stone-950 hover:bg-stone-900 border border-stone-900 hover:border-gold-400/30 text-[10px] text-stone-300 text-left rounded-xl transition-all cursor-pointer"
                      >
                        <span className="block font-bold text-gold-400 mb-0.5">❤️ Renda Vermelha Premium</span>
                        <span className="text-[9px] text-stone-500 line-clamp-1">Lingerie luxuosa sobre mármore preto polido...</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAiPrompt("Estilo boudoir elegante e sofisticado, lingerie luxuosa de seda branca e renda delicada drapeada romanticamente em uma cadeira clássica dourada, fundo desfocado com iluminação âmbar acolhedora.");
                          showToast("Prompt de Boudoir Branco inserido!");
                        }}
                        className="p-2 bg-stone-950 hover:bg-stone-900 border border-stone-900 hover:border-gold-400/30 text-[10px] text-stone-300 text-left rounded-xl transition-all cursor-pointer"
                      >
                        <span className="block font-bold text-gold-400 mb-0.5">🤍 Boudoir Romântico Branco</span>
                        <span className="text-[9px] text-stone-500 line-clamp-1">Estilo boudoir clássico e misterioso...</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAiPrompt("Design minimalista moderno, um frasco elegante de perfume íntimo e cosmético ao lado de sabonete refinado e pétalas de rosa fresca, gotas de orvalho delicadas, iluminação natural suave de fim de tarde.");
                          showToast("Prompt de Cosmético inserido!");
                        }}
                        className="p-2 bg-stone-950 hover:bg-stone-900 border border-stone-900 hover:border-gold-400/30 text-[10px] text-stone-300 text-left rounded-xl transition-all cursor-pointer"
                      >
                        <span className="block font-bold text-gold-400 mb-0.5">🧴 Cosmético & Sexshop Luxo</span>
                        <span className="text-[9px] text-stone-500 line-clamp-1">Design minimalista moderno, frasco elegante...</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAiPrompt("Foto publicitária de luxo focado nos detalhes da costura e da renda sofisticada delicada de um sutiã preto premium, fundo neutro em tons de cinza suave e iluminação profissional focada de estúdio.");
                          showToast("Prompt de Renda Sofisticada inserido!");
                        }}
                        className="p-2 bg-stone-950 hover:bg-stone-900 border border-stone-900 hover:border-gold-400/30 text-[10px] text-stone-300 text-left rounded-xl transition-all cursor-pointer"
                      >
                        <span className="block font-bold text-gold-400 mb-0.5">🖤 Close-up Renda Sofisticada</span>
                        <span className="text-[9px] text-stone-500 line-clamp-1">Foto publicitária focada nos detalhes da costura...</span>
                      </button>
                    </div>
                  </div>

                  {/* Submit Trigger Button */}
                  <button
                    type="button"
                    disabled={aiLoading}
                    onClick={handleGenerateAiImage}
                    className="w-full bg-gradient-to-r from-gold-500 to-burgundy-600 hover:from-gold-400 hover:to-burgundy-500 disabled:from-stone-850 disabled:to-stone-900 disabled:text-stone-500 font-extrabold uppercase tracking-widest text-[11px] py-4 rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-lg"
                  >
                    {aiLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Processando Imagem com IA...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-burgundy-950" />
                        <span>
                          {aiMode === "generate" ? "Gerar Nova Imagem com IA" : "Editar Imagem com IA"}
                        </span>
                      </>
                    )}
                  </button>
                </div>

                {/* Right Side: Visualizer Canvas & Outputs */}
                <div className="w-full lg:w-1/2 p-6 flex flex-col space-y-4 overflow-y-auto bg-stone-950/20 items-center justify-center relative min-h-[45vh] lg:min-h-0">
                  {aiLoading ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center space-y-6 bg-stone-950/40 rounded-3xl border border-gold-500/10 max-w-sm w-full shadow-2xl animate-pulse">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-gold-500 to-burgundy-900/30 flex items-center justify-center text-gold-300 relative">
                        <Sparkles className="w-8 h-8 animate-spin duration-3000" />
                        <div className="absolute inset-0 rounded-full border border-gold-400/40 animate-ping opacity-30"></div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-gold-300 uppercase tracking-widest font-display">Estúdio Criativo Gemini</h4>
                        <p className="text-[11px] text-stone-400 leading-relaxed max-w-[250px]">
                          Desenhando texturas de renda, ajustando iluminação boudoir e processando detalhes em alta resolução...
                        </p>
                      </div>
                    </div>
                  ) : aiError ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 bg-red-950/20 rounded-3xl border border-red-900/40 max-w-md">
                      <div className="w-12 h-12 rounded-full bg-red-900/10 flex items-center justify-center text-red-400">
                        <X className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest">Falha na Operação</h4>
                        <p className="text-[11px] text-stone-400 leading-relaxed">
                          {aiError}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleGenerateAiImage}
                        className="text-[10px] uppercase tracking-wider font-extrabold text-gold-400 hover:text-gold-300 bg-stone-900 border border-stone-800 px-4 py-2 rounded-lg cursor-pointer transition-all"
                      >
                        Tentar Novamente
                      </button>
                    </div>
                  ) : aiResultImage ? (
                    <div className="space-y-4 w-full max-w-sm">
                      <div className="space-y-1 text-center">
                        <span className="block text-[9px] text-gold-400 font-extrabold uppercase tracking-widest">Sua Imagem Pronta</span>
                        <p className="text-[10px] text-stone-500 font-medium">Desenvolvida com Inteligência Artificial</p>
                      </div>

                      {/* Resulting Image Container with premium frame */}
                      <div className="bg-stone-950 p-2.5 rounded-3xl border border-gold-500/15 overflow-hidden shadow-2xl relative group">
                        <img
                          src={aiResultImage}
                          alt="AI Studio Result"
                          className="w-full h-auto aspect-square object-cover rounded-2xl border border-stone-900"
                        />
                        <div className="absolute top-4 right-4 bg-stone-950/80 backdrop-blur-md text-[9px] font-bold text-gold-400 px-2 py-1 rounded-full uppercase tracking-wider border border-gold-400/20">
                          Estúdio IA
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => {
                            setFormImage(aiResultImage);
                            setActiveTab("catalog");
                            showToast("Imagem da IA foi aplicada ao formulário do produto!");
                          }}
                          className="w-full bg-gold-500 hover:bg-gold-400 text-burgundy-950 font-extrabold uppercase tracking-widest text-[10px] py-3 rounded-xl transition-all cursor-pointer text-center flex items-center justify-center space-x-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Usar no Cadastro de Produto</span>
                        </button>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(aiResultImage);
                              showToast("URL de imagem (Base64) copiada para a área de transferência!");
                            }}
                            className="flex-1 bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-300 text-[10px] font-extrabold uppercase tracking-wider py-2 rounded-lg transition-all cursor-pointer text-center"
                          >
                            Copiar Link
                          </button>
                          <a
                            href={aiResultImage}
                            download="bellenuit-ia-studio.png"
                            className="flex-1 bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-300 text-[10px] font-extrabold uppercase tracking-wider py-2 rounded-lg transition-all text-center"
                          >
                            Baixar Imagem
                          </a>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Initial Canvas Placeholder state */
                    <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 max-w-sm bg-stone-950/35 border border-stone-900 rounded-3xl py-12">
                      <div className="w-16 h-16 rounded-full bg-stone-900/60 border border-stone-850 flex items-center justify-center text-stone-500">
                        <ImageIcon className="w-7 h-7" />
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-bold text-stone-300 uppercase tracking-widest">Visualizador do Estúdio</h4>
                        <p className="text-[11px] text-stone-500 leading-relaxed">
                          Configure as opções e crie ou edite imagens. Elas serão renderizadas aqui em tempo real.
                        </p>
                      </div>
                      <div className="bg-stone-900/40 px-3 py-1.5 rounded-lg border border-stone-850/60 text-[9px] uppercase tracking-wider text-stone-400">
                        Aguardando Instruções
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}
          </div>
        )}

        {/* Manual Cropper Modal */}
        {isCropperOpen && originalUncroppedImage && (
          <div className="fixed inset-0 z-[100] bg-stone-950/95 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-stone-900 border border-gold-500/20 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]">
              
              {/* Left Column: Interactive Canvas/Preview */}
              <div className="flex-1 p-6 bg-stone-950 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-stone-850 min-h-[300px] md:min-h-[450px]">
                <div className="mb-4 text-center">
                  <span className="block text-[10px] text-gold-400 font-bold uppercase tracking-widest mb-1">Área de Recorte Interativa</span>
                  <p className="text-[10px] text-stone-400">Arraste um retângulo sobre a imagem para recortar livremente</p>
                </div>

                <div 
                  ref={containerRef}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  className="relative overflow-hidden rounded-xl border border-stone-800 bg-stone-950 cursor-crosshair inline-block select-none max-w-full max-h-[350px] md:max-h-[420px]"
                >
                  <img 
                    src={originalUncroppedImage} 
                    alt="Original Uncropped" 
                    className="max-h-[350px] md:max-h-[420px] w-auto block select-none pointer-events-none"
                    draggable={false}
                  />
                  {/* Visual Translucent Mask with highlight selection */}
                  <div 
                    className="absolute border-2 border-gold-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] pointer-events-none transition-all duration-75"
                    style={{
                      left: `${cropBoxState.x}%`,
                      top: `${cropBoxState.y}%`,
                      width: `${cropBoxState.width}%`,
                      height: `${cropBoxState.height}%`,
                    }}
                  >
                    {/* Tiny visual indicators on corner */}
                    <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-gold-300 -translate-x-[1px] -translate-y-[1px]"></div>
                    <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-gold-300 translate-x-[1px] -translate-y-[1px]"></div>
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-gold-300 -translate-x-[1px] translate-y-[1px]"></div>
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-gold-300 translate-x-[1px] translate-y-[1px]"></div>
                    
                    {/* Centered label */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-40">
                      <Crop className="w-6 h-6 text-gold-300 animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Precision Sliders and Controls */}
              <div className="w-full md:w-[350px] p-6 flex flex-col justify-between overflow-y-auto space-y-6">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-stone-100 flex items-center gap-1.5 font-display">
                        <Crop className="w-4 h-4 text-gold-400" />
                        <span>Ajustar Recorte da Foto</span>
                      </h3>
                      <p className="text-[10px] text-stone-400 mt-0.5 leading-relaxed">
                        Ajuste as margens de corte ou use os botões rápidos de proporção.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCropperOpen(false);
                        setEditingImageIndex(null);
                      }}
                      className="p-1 rounded-lg bg-stone-950 hover:bg-stone-850 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Preset Aspect Ratios */}
                  <div className="space-y-2 mb-4">
                    <span className="block text-[9px] uppercase tracking-wider text-stone-400 font-bold">Proporções</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setLockedRatio("free");
                        }}
                        className={`py-1.5 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                          lockedRatio === "free"
                            ? "bg-gold-500/10 border-gold-500/30 text-gold-400"
                            : "bg-stone-950 border-stone-850 text-stone-400 hover:text-stone-300"
                        }`}
                      >
                        Livre
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLockedRatio("1:1");
                          setCropBoxState(prev => {
                            const size = Math.min(prev.width, 100 - prev.y);
                            return { ...prev, height: size, width: size };
                          });
                        }}
                        className={`py-1.5 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                          lockedRatio === "1:1"
                            ? "bg-gold-500/10 border-gold-500/30 text-gold-400"
                            : "bg-stone-950 border-stone-850 text-stone-400 hover:text-stone-300"
                        }`}
                      >
                        1:1 (Quadrado)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLockedRatio("3:4");
                          setCropBoxState(prev => {
                            const w = prev.width;
                            const h = Math.min(100 - prev.y, w * (4 / 3));
                            const finalW = h * (3 / 4);
                            return { ...prev, width: finalW, height: h };
                          });
                        }}
                        className={`py-1.5 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                          lockedRatio === "3:4"
                            ? "bg-gold-500/10 border-gold-500/30 text-gold-400"
                            : "bg-stone-950 border-stone-850 text-stone-400 hover:text-stone-300"
                        }`}
                      >
                        3:4 (Retrato)
                      </button>
                    </div>
                  </div>

                  {/* Precision sliders */}
                  <div className="space-y-3">
                    <span className="block text-[9px] uppercase tracking-wider text-stone-400 font-bold">Ajustes Finos</span>
                    
                    {/* Slider X */}
                    <div className="space-y-1 bg-stone-950 p-2.5 rounded-xl border border-stone-850">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-stone-400">Esquerda (X)</span>
                        <span className="text-gold-400 font-bold">{Math.round(cropBoxState.x)}%</span>
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max={100 - cropBoxState.width}
                        value={cropBoxState.x}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setCropBoxState(prev => ({ ...prev, x: val }));
                        }}
                        className="w-full accent-gold-500 cursor-pointer"
                      />
                    </div>

                    {/* Slider Y */}
                    <div className="space-y-1 bg-stone-950 p-2.5 rounded-xl border border-stone-850">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-stone-400">Topo (Y)</span>
                        <span className="text-gold-400 font-bold">{Math.round(cropBoxState.y)}%</span>
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max={100 - cropBoxState.height}
                        value={cropBoxState.y}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setCropBoxState(prev => ({ ...prev, y: val }));
                        }}
                        className="w-full accent-gold-500 cursor-pointer"
                      />
                    </div>

                    {/* Slider Width */}
                    <div className="space-y-1 bg-stone-950 p-2.5 rounded-xl border border-stone-850">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-stone-400">Largura</span>
                        <span className="text-gold-400 font-bold">{Math.round(cropBoxState.width)}%</span>
                      </div>
                      <input 
                        type="range"
                        min="10"
                        max={100 - cropBoxState.x}
                        value={cropBoxState.width}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setCropBoxState(prev => {
                            let h = prev.height;
                            if (lockedRatio === "1:1") {
                              h = Math.min(100 - prev.y, val);
                            } else if (lockedRatio === "3:4") {
                              h = Math.min(100 - prev.y, val * (4 / 3));
                            }
                            return { ...prev, width: val, height: h };
                          });
                        }}
                        className="w-full accent-gold-500 cursor-pointer"
                      />
                    </div>

                    {/* Slider Height */}
                    <div className="space-y-1 bg-stone-950 p-2.5 rounded-xl border border-stone-850">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-stone-400">Altura</span>
                        <span className="text-gold-400 font-bold">{Math.round(cropBoxState.height)}%</span>
                      </div>
                      <input 
                        type="range"
                        min="10"
                        max={100 - cropBoxState.y}
                        value={cropBoxState.height}
                        disabled={lockedRatio !== "free"}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setCropBoxState(prev => ({ ...prev, height: val }));
                        }}
                        className={`w-full accent-gold-500 cursor-pointer ${lockedRatio !== "free" ? "opacity-55" : ""}`}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-stone-850">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const croppedBase64 = await cropImageCanvas(originalUncroppedImage, cropBoxState);
                        if (editingImageIndex !== null && editingImageIndex !== -1) {
                          const originalUrl = formImages[editingImageIndex];
                          setFormImages(prev => {
                            const updated = [...prev];
                            updated[editingImageIndex] = croppedBase64;
                            return updated;
                          });
                          if (originalUrl === formImage) {
                            setFormImage(croppedBase64);
                          }
                        } else {
                          setFormImage(croppedBase64);
                        }
                        setIsAutoCropped(true);
                        setIsCropperOpen(false);
                        setEditingImageIndex(null);
                        showToast("✨ Foto recortada com sucesso!");
                      } catch (err) {
                        showToast("Não foi possível realizar o corte. Tente novamente.");
                      }
                    }}
                    className="w-full bg-gold-500 hover:bg-gold-400 text-burgundy-950 font-extrabold uppercase tracking-widest text-[10px] py-3 rounded-xl transition-all cursor-pointer text-center flex items-center justify-center space-x-1.5 shadow-lg"
                  >
                    <Crop className="w-3.5 h-3.5" />
                    <span>Aplicar Novo Recorte</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCropBoxState({ x: 0, y: 0, width: 100, height: 100 });
                      setLockedRatio("free");
                      showToast("Recorte estendido para a imagem inteira!");
                    }}
                    className="w-full bg-stone-950 hover:bg-stone-900 border border-stone-800 text-stone-300 hover:text-stone-100 font-bold text-[10px] py-2 rounded-xl transition-all cursor-pointer text-center"
                  >
                    Limpar / Selecionar Tudo
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Image Quality Enhancer & Upscaling Modal */}
        {(() => {
          const activeEnhancingImage = editingImageIndex !== null && editingImageIndex !== -1 ? formImages[editingImageIndex] : formImage;
          if (!isEnhancerOpen || !activeEnhancingImage) return null;
          return (
            <div className="fixed inset-0 z-[100] bg-stone-950/95 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-stone-900 border border-purple-500/20 rounded-3xl max-w-5xl w-full overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[95vh]">
                
                {/* Left Side: Live Comparison Canvas */}
                <div className="flex-1 p-6 bg-stone-950 flex flex-col border-b md:border-b-0 md:border-r border-stone-850 overflow-y-auto">
                  <div className="mb-4 flex justify-between items-center">
                    <div>
                      <span className="block text-[10px] text-purple-400 font-bold uppercase tracking-widest mb-1">
                        Visualizador de Comparação
                      </span>
                      <p className="text-[10px] text-stone-400">
                        Veja a diferença de nitidez e vibração em tempo real
                      </p>
                    </div>
                    {isProcessingEnhance && (
                      <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-1 rounded-md animate-pulse flex items-center gap-1.5 font-bold">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        REPROCESSANDO...
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 items-center justify-center">
                    {/* Before View */}
                    <div className="relative group rounded-xl overflow-hidden border border-stone-800 bg-stone-900">
                      <img 
                        src={activeEnhancingImage} 
                        alt="Antes" 
                        className="w-full h-auto max-h-[300px] md:max-h-[380px] object-contain mx-auto"
                      />
                      <div className="absolute top-2 left-2 bg-stone-950/80 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[9px] font-bold text-stone-300 border border-stone-800 uppercase tracking-widest">
                        Antes (Original)
                      </div>
                    </div>

                    {/* After View with Upscale Enhancement */}
                    <div className="relative group rounded-xl overflow-hidden border border-purple-500/30 bg-stone-900 shadow-lg shadow-purple-500/5">
                      {isProcessingEnhance ? (
                        <div className="absolute inset-0 bg-stone-950/85 backdrop-blur-sm flex flex-col items-center justify-center space-y-3 z-10">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-full border-2 border-purple-500/10 border-t-purple-400 animate-spin"></div>
                            <Sparkles className="w-5 h-5 text-purple-400 absolute inset-0 m-auto animate-pulse" />
                          </div>
                          <div className="text-center">
                            <p className="text-xs font-bold text-purple-300">Recalculando Pixels</p>
                            <p className="text-[9px] text-stone-500 uppercase tracking-wider mt-1">Reforçando contornos & texturas...</p>
                          </div>
                        </div>
                      ) : null}
                      
                      <img 
                        src={enhancedPreviewImage || activeEnhancingImage} 
                        alt="Depois" 
                        className="w-full h-auto max-h-[300px] md:max-h-[380px] object-contain mx-auto"
                      />
                      <div className="absolute top-2 left-2 bg-purple-950/80 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[9px] font-bold text-purple-300 border border-purple-500/30 uppercase tracking-widest">
                        Depois (Melhorado HD)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side: Enhancement Control Console */}
                <div className="w-full md:w-[360px] p-6 flex flex-col justify-between overflow-y-auto space-y-6 bg-stone-900/40">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-stone-100 flex items-center gap-1.5 font-display">
                          <Sparkles className="w-4 h-4 text-purple-400" />
                          <span>Melhorador de Imagens HD</span>
                        </h3>
                        <p className="text-[10px] text-stone-400 mt-0.5 leading-relaxed">
                          Aumente a definição das fotos do seu catálogo usando filtros matemáticos de alta frequência e ajustes de contraste profissional.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEnhancerOpen(false);
                          setEditingImageIndex(null);
                        }}
                        className="p-1 rounded-lg bg-stone-950 hover:bg-stone-850 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Super resolution toggle */}
                    <div className="space-y-3 mb-6 p-4 rounded-2xl bg-stone-950/80 border border-purple-500/10 shadow-inner">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="block text-xs font-bold text-stone-200">Super Resolução 2x</span>
                          <span className="block text-[9px] text-stone-500">Duplica o número de pixels via interpolação HD</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const nextVal = !upscale2x;
                            setUpscale2x(nextVal);
                            handleUpdateEnhancementPreview(enhancementLevel, nextVal);
                          }}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            upscale2x ? "bg-purple-500" : "bg-stone-800"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-stone-100 shadow ring-0 transition duration-200 ease-in-out ${
                              upscale2x ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Sharpness level selection cards */}
                    <div className="space-y-2.5">
                      <span className="block text-[9px] uppercase tracking-wider text-stone-400 font-bold">
                        Nível de Nitidez & Contraste
                      </span>

                      {/* Level Soft */}
                      <button
                        type="button"
                        onClick={() => {
                          setEnhancementLevel("soft");
                          handleUpdateEnhancementPreview("soft", upscale2x);
                        }}
                        className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                          enhancementLevel === "soft"
                            ? "bg-purple-500/10 border-purple-500/40 shadow-md shadow-purple-500/5"
                            : "bg-stone-950 border-stone-850 hover:border-stone-800 text-stone-300"
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${enhancementLevel === "soft" ? "bg-purple-400 animate-pulse" : "bg-stone-700"}`} />
                        <div>
                          <span className="block text-xs font-bold text-stone-100">Foco Suave (Light Sharp)</span>
                          <span className="block text-[9px] text-stone-400 mt-0.5">Discreto realce de contornos e cores suaves, ideal para peles.</span>
                        </div>
                      </button>

                      {/* Level Medium */}
                      <button
                        type="button"
                        onClick={() => {
                          setEnhancementLevel("medium");
                          handleUpdateEnhancementPreview("medium", upscale2x);
                        }}
                        className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                          enhancementLevel === "medium"
                            ? "bg-purple-500/10 border-purple-500/40 shadow-md shadow-purple-500/5"
                            : "bg-stone-950 border-stone-850 hover:border-stone-800 text-stone-300"
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${enhancementLevel === "medium" ? "bg-purple-400 animate-pulse" : "bg-stone-700"}`} />
                        <div>
                          <span className="block text-xs font-bold text-stone-100 flex items-center gap-1.5">
                            <span>Nitidez Médio (E-commerce HD)</span>
                            <span className="text-[8px] bg-purple-500/20 text-purple-300 px-1 py-0.2 rounded font-extrabold uppercase">Recomendado</span>
                          </span>
                          <span className="block text-[9px] text-stone-400 mt-0.5">Foco ideal para lingeries. Destaca detalhes de rendas e tecidos.</span>
                        </div>
                      </button>

                      {/* Level Ultra */}
                      <button
                        type="button"
                        onClick={() => {
                          setEnhancementLevel("ultra");
                          handleUpdateEnhancementPreview("ultra", upscale2x);
                        }}
                        className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                          enhancementLevel === "ultra"
                            ? "bg-purple-500/10 border-purple-500/40 shadow-md shadow-purple-500/5"
                            : "bg-stone-950 border-stone-850 hover:border-stone-800 text-stone-300"
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${enhancementLevel === "ultra" ? "bg-purple-400 animate-pulse" : "bg-stone-700"}`} />
                        <div>
                          <span className="block text-xs font-bold text-stone-100">Super Definição 4K (Ultra Detail)</span>
                          <span className="block text-[9px] text-stone-400 mt-0.5">Contraste acentuado e sharpening agressivo para máxima nitidez de acessórios.</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-stone-850">
                    <button
                      type="button"
                      disabled={isProcessingEnhance}
                      onClick={() => {
                        if (enhancedPreviewImage) {
                          if (editingImageIndex !== null && editingImageIndex !== -1) {
                            const originalUrl = formImages[editingImageIndex];
                            setFormImages(prev => {
                              const updated = [...prev];
                              updated[editingImageIndex] = enhancedPreviewImage;
                              return updated;
                            });
                            if (originalUrl === formImage) {
                              setFormImage(enhancedPreviewImage);
                            }
                          } else {
                            setFormImage(enhancedPreviewImage);
                          }
                          setIsEnhancerOpen(false);
                          setEditingImageIndex(null);
                          showToast("✨ Imagem atualizada com realce de qualidade HD!");
                        } else {
                          showToast("Aguarde a imagem terminar de processar.");
                        }
                      }}
                      className={`w-full bg-purple-500 hover:bg-purple-400 text-stone-950 font-extrabold uppercase tracking-widest text-[10px] py-3.5 rounded-xl transition-all cursor-pointer text-center flex items-center justify-center space-x-1.5 shadow-lg shadow-purple-500/10 ${
                        isProcessingEnhance ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Aplicar Realce HD</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsEnhancerOpen(false);
                        setEditingImageIndex(null);
                      }}
                      className="w-full bg-stone-950 hover:bg-stone-900 border border-stone-800 text-stone-300 hover:text-stone-100 font-bold text-[10px] py-2.5 rounded-xl transition-all cursor-pointer text-center"
                    >
                      Descartar e Cancelar
                    </button>
                  </div>
                </div>

              </div>
            </div>
          );
        })()}

        {/* Footer info lock indicator */}
        <div className="p-4 bg-stone-950 border-t border-burgundy-900/60 text-center text-[10px] text-stone-500 flex items-center justify-center gap-1.5">
          <Lock className="w-3 h-3" />
          <span>Sessão protegida por criptografia local de ponta-a-ponta. Todas as alterações são salvas localmente.</span>
        </div>

      </div>
    </div>
  );
}
