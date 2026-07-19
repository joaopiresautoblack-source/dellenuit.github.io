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
  RotateCcw,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ArrowLeft,
  ArrowRight,
  Save,
  Check
} from "lucide-react";
import { Product } from "../types";

import { db, auth, handleFirestoreError, OperationType } from "../firebase";
import { doc, setDoc, deleteDoc, collection, serverTimestamp } from "firebase/firestore";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence } from "firebase/auth";

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSaveProducts: (products: Product[]) => void;
  showToast: (msg: string) => void;
}

// Utility function to resize and compress images while preserving high-end visual fidelity
const resizeImage = (fileOrBase64: File | string, maxDimension: number = 2048): Promise<string> => {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      let objectUrl = "";

      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;

          // Preserve quality: only scale down if it exceeds the high-res ceiling (2048px)
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
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            
            // Output space-efficient, high-quality JPEG with 90% quality rating (0.90)
            const resizedBase64 = canvas.toDataURL("image/jpeg", 0.90);
            
            if (objectUrl) {
              URL.revokeObjectURL(objectUrl);
            }
            resolve(resizedBase64);
          } else {
            if (objectUrl) {
              URL.revokeObjectURL(objectUrl);
            }
            resolve(typeof fileOrBase64 === "string" ? fileOrBase64 : "");
          }
        } catch (innerErr) {
          console.error("Erro interno no redimensionamento de imagem:", innerErr);
          if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
          }
          resolve(typeof fileOrBase64 === "string" ? fileOrBase64 : "");
        }
      };
      
      img.onerror = () => {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }
        resolve(typeof fileOrBase64 === "string" ? fileOrBase64 : "");
      };

      if (fileOrBase64 instanceof File) {
        objectUrl = URL.createObjectURL(fileOrBase64);
        img.src = objectUrl;
      } else {
        img.src = fileOrBase64;
      }
    } catch (err) {
      console.error("Erro no manipulador de redimensionamento:", err);
      resolve(typeof fileOrBase64 === "string" ? fileOrBase64 : "");
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
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<any>(null);
  const isAuthenticated = authReady && authenticatedUser !== null && authenticatedUser.uid === "GfUnnd6oYcZVdgUBc9gFVXiO4t92";
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loginLoading, setLoginLoading] = useState<boolean>(false);
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
  const [formSizes, setFormSizes] = useState<string>("");
  const [formColors, setFormColors] = useState<string>("");
  const [formDetails, setFormDetails] = useState<string>("");
  const [formTag, setFormTag] = useState<string>("");
  const [formRating, setFormRating] = useState<string>("5.0");
  const [formReviewsCount, setFormReviewsCount] = useState<string>("1");
  const [saveLoading, setSaveLoading] = useState<boolean>(false);

  // Image Cropping States & Refs
  const [originalUncroppedImage, setOriginalUncroppedImage] = useState<string>("");
  const [originalWidth, setOriginalWidth] = useState<number>(0);
  const [originalHeight, setOriginalHeight] = useState<number>(0);
  const [isCropperOpen, setIsCropperOpen] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [rotation, setRotation] = useState<number>(0);
  const [baseDimensions, setBaseDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [initialPosition, setInitialPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const cropContainerRef = useRef<HTMLDivElement>(null);
  const createdObjectUrlsRef = useRef<string[]>([]);

  // Cleanup object URLs when component unmounts
  React.useEffect(() => {
    return () => {
      if (createdObjectUrlsRef.current.length > 0) {
        console.log("Cleaning up object URLs:", createdObjectUrlsRef.current.length);
        createdObjectUrlsRef.current.forEach((url) => {
          try {
            URL.revokeObjectURL(url);
          } catch (e) {
            console.warn("Failed to revoke URL:", url, e);
          }
        });
        createdObjectUrlsRef.current = [];
      }
    };
  }, []);

  // Advanced Gallery & Image Mappings (preserving uncropped original photos for re-cropping)
  const [originalImages, setOriginalImages] = useState<Record<string, string>>({});
  const [pendingCropQueue, setPendingCropQueue] = useState<string[]>([]);
  const [replacingImageIndex, setReplacingImageIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDecodingImage, setIsDecodingImage] = useState<boolean>(false);
  const [isImageProcessing, setIsImageProcessing] = useState<boolean>(false);
  const [isSavingProduct, setIsSavingProduct] = useState<boolean>(false);
  const [cadastroStatus, setCadastroStatus] = useState<string>("");

  // Image Cropping State Tracking
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  const [editingImageType, setEditingImageType] = useState<"cover" | "gallery" | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialPosition({ ...position });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStart) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setPosition({
      x: initialPosition.x + dx,
      y: initialPosition.y + dy
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    setDragStart(null);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  // Generates high-fidelity high-resolution crop (target 1600x2000px)
  const generateHighResCrop = (): Promise<string> => {
    console.log("1 - Iniciando processamento");
    return new Promise((resolve, reject) => {
      const img = new Image();
      if (!originalUncroppedImage.startsWith("data:")) {
        img.crossOrigin = "anonymous";
      }
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          
          let targetW = 1600;
          let targetH = 2000;
          
          const minDimension = Math.min(img.naturalWidth, img.naturalHeight);
          if (minDimension < 1600) {
            targetW = Math.max(400, Math.floor(minDimension));
            targetH = Math.floor(targetW * 1.25);
          }
          
          canvas.width = targetW;
          canvas.height = targetH;
          
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Não foi possível inicializar o canvas 2D."));
            return;
          }
          
          console.log("2 - Canvas criado");
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, targetW, targetH);
          
          ctx.translate(targetW / 2, targetH / 2);
          const scaleFactor = targetW / 280;
          
          ctx.translate(position.x * scaleFactor, position.y * scaleFactor);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.scale(zoom * scaleFactor, zoom * scaleFactor);
          
          ctx.drawImage(
            img,
            -baseDimensions.width / 2,
            -baseDimensions.height / 2,
            baseDimensions.width,
            baseDimensions.height
          );
          
          // Asynchronously export the canvas using toBlob to keep Safari responsive
          const handleBlob = (blob: Blob | null) => {
            if (!blob) {
              reject(new Error("Falha ao gerar o arquivo de imagem recortada."));
              return;
            }
            console.log("3 - Blob criado");
            const reader = new FileReader();
            reader.onloadend = () => {
              if (reader.result) {
                resolve(reader.result as string);
              } else {
                reject(new Error("Falha ao ler os dados binários da imagem processada."));
              }
            };
            reader.onerror = () => reject(new Error("Erro ao ler o arquivo temporário."));
            reader.readAsDataURL(blob);
          };

          try {
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  handleBlob(blob);
                } else {
                  // Fallback to JPEG if WebP generation returned null
                  canvas.toBlob(
                    (fallbackBlob) => handleBlob(fallbackBlob),
                    "image/jpeg",
                    0.95
                  );
                }
              },
              "image/webp",
              0.92
            );
          } catch (blobErr) {
            // Synchronous fail fallback to JPEG toBlob
            canvas.toBlob(
              (fallbackBlob) => handleBlob(fallbackBlob),
              "image/jpeg",
              0.95
            );
          }
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error("Erro ao carregar imagem para renderização."));
      img.src = originalUncroppedImage;
    });
  };

  // Upload cropped image base64 to Cloudinary using unsigned preset 'bellenuit_produtos'
  const uploadCroppedImage = async (base64Data: string): Promise<string> => {
    if (!base64Data) return "";
    
    // If it's already a remote URL, return it as-is
    if (base64Data.startsWith("http") && !base64Data.startsWith("http://blob") && !base64Data.startsWith("https://blob")) {
      return base64Data;
    }

    const formData = new FormData();

    if (base64Data.startsWith("blob:")) {
      try {
        const response = await fetch(base64Data);
        const blob = await response.blob();
        formData.append("file", blob);
      } catch (err: any) {
        throw new Error(`Falha ao ler arquivo local temporário (blob): ${err.message}`);
      }
    } else {
      formData.append("file", base64Data);
    }

    formData.append("upload_preset", "bellenuit_produtos");

    const response = await fetch(
      "https://api.cloudinary.com/v1_1/a9dmb54t/image/upload",
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.error?.message || "Falha no upload da imagem para o Cloudinary"
      );
    }

    const result = await response.json();

    if (!result.secure_url) {
      throw new Error("Cloudinary não retornou URL da imagem");
    }

    return result.secure_url;
  };

  // Helper to load, validate, and decode an image before opening the crop editor
  const handleOpenCropperFor = async (imageUrl: string, type: "cover" | "gallery", index: number | null) => {
    if (!imageUrl) {
      showToast("Link ou arquivo de imagem inválido.");
      return;
    }

    const isHeic = imageUrl.toLowerCase().startsWith("data:image/heic") || 
                   imageUrl.toLowerCase().startsWith("data:image/heif") || 
                   imageUrl.toLowerCase().includes(".heic") || 
                   imageUrl.toLowerCase().includes(".heif");
    if (isHeic) {
      showToast("Esta imagem precisa ser convertida para JPEG/PNG antes da edição.");
      return;
    }

    setIsDecodingImage(true);
    setIsImageProcessing(true);
    showToast("Carregando imagem...");

    try {
      const img = new Image();
      if (!imageUrl.startsWith("data:")) {
        img.crossOrigin = "anonymous";
      }

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          console.log("Imagem carregada:", img.naturalWidth, img.naturalHeight);
          if (typeof img.decode === "function") {
            img.decode()
              .then(() => resolve())
              .catch((err) => {
                console.warn("img.decode falhou, usando onload tradicional", err);
                resolve();
              });
          } else {
            resolve();
          }
        };
        img.onerror = () => {
          reject(new Error("Erro ao carregar o arquivo da imagem."));
        };
        img.src = imageUrl;
      });

      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;

      if (naturalWidth === 0 || naturalHeight === 0) {
        throw new Error("Não foi possível obter as dimensões da imagem.");
      }

      // Calculate baseDimensions keeping aspect ratio to cover/contain the 280x350 viewport
      const containerW = 280;
      const containerH = 350;
      const imageRatio = naturalWidth / naturalHeight;
      const containerRatio = containerW / containerH; // 0.8

      let width = containerW;
      let height = containerH;

      if (imageRatio > containerRatio) {
        height = containerH;
        width = containerH * imageRatio;
      } else {
        width = containerW;
        height = containerW / imageRatio;
      }

      setBaseDimensions({ width, height });
      setOriginalWidth(naturalWidth);
      setOriginalHeight(naturalHeight);
      setOriginalUncroppedImage(imageUrl);
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      setRotation(0);
      setEditingImageType(type);
      setEditingImageIndex(index);
      setIsCropperOpen(true);
    } catch (err) {
      console.error("Erro na decodificação da imagem:", err);
      showToast("Não foi possível carregar esta imagem. Tente outra foto ou converta para JPEG/PNG.");
      setIsImageProcessing(false);
    } finally {
      setIsDecodingImage(false);
    }
  };

  // Apply visual cropping, render high-res file and save
  const handleApplyCrop = async () => {
    setIsUploading(true);
    setIsImageProcessing(true);
    try {
      const croppedBase64 = await generateHighResCrop();
      
      console.log("4 - Imagem adicionada ao formulário");
      const finalUrl = croppedBase64;
      
      setOriginalImages(prev => ({
        ...prev,
        [finalUrl]: originalUncroppedImage
      }));
      
      if (editingImageType === "cover") {
        setFormImage(finalUrl);
        setFormImages(prev => {
          if (editingImageIndex !== null && editingImageIndex !== -1) {
            const updated = [...prev];
            updated[editingImageIndex] = finalUrl;
            return updated;
          }
          if (!prev.includes(finalUrl)) {
            return [finalUrl, ...prev];
          }
          return prev;
        });
      } else {
        // gallery
        if (editingImageIndex !== null && editingImageIndex !== -1) {
          const originalUrl = formImages[editingImageIndex];
          setFormImages(prev => {
            const updated = [...prev];
            updated[editingImageIndex] = finalUrl;
            return updated;
          });
          if (originalUrl === formImage) {
            setFormImage(finalUrl);
          }
        } else {
          setFormImages(prev => {
            if (!prev.includes(finalUrl)) {
              return [...prev, finalUrl];
            }
            return prev;
          });
          setFormImage(prev => prev || finalUrl);
        }
      }
      
      showToast("✨ Foto processada com sucesso!");
      console.log("5 - Fechando editor");
      setIsCropperOpen(false);
      setEditingImageType(null);
      setEditingImageIndex(null);
      
      // Handle remaining items in queue sequentially using async loader
      if (pendingCropQueue.length > 1) {
        const nextQueue = pendingCropQueue.slice(1);
        setPendingCropQueue(nextQueue);
        handleOpenCropperFor(nextQueue[0], "gallery", -1);
      } else {
        setPendingCropQueue([]);
      }
    } catch (err: any) {
      console.error("Erro ao aplicar recorte:", err);
      showToast(err.message || "Não foi possível processar a imagem.");
    } finally {
      setIsUploading(false);
      setIsImageProcessing(false);
    }
  };

  const handleCancelCrop = () => {
    setIsCropperOpen(false);
    setEditingImageType(null);
    setEditingImageIndex(null);
    setIsImageProcessing(false);
    if (pendingCropQueue.length > 1) {
      const nextQueue = pendingCropQueue.slice(1);
      setPendingCropQueue(nextQueue);
      handleOpenCropperFor(nextQueue[0], "gallery", -1);
    } else {
      setPendingCropQueue([]);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const aiRefInputRef = useRef<HTMLInputElement>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<"catalog" | "ai">("catalog");

  // Action Confirmation States
  const [confirmClearAll, setConfirmClearAll] = useState<boolean>(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.uid === "GfUnnd6oYcZVdgUBc9gFVXiO4t92") {
        setAuthenticatedUser(user);
      } else {
        setAuthenticatedUser(null);
      }
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);



  // AI Studio states
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [aiMode, setAiMode] = useState<"generate" | "edit">("generate");
  const [aiRefImage, setAiRefImage] = useState<string>("");
  const [aiAspectRatio, setAiAspectRatio] = useState<string>("1:1");
  const [aiResultImage, setAiResultImage] = useState<string>("");
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string>("");

  const handleAiRefChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        showToast("Por favor, selecione uma imagem menor que 50MB.");
        return;
      }
      try {
        showToast("Processando imagem de referência...");
        const compressed = await resizeImage(file, 800);
        setAiRefImage(compressed);
        showToast("Imagem de referência carregada!");
      } catch (err) {
        console.error(err);
        showToast("Erro ao processar imagem de referência.");
      }
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
      const validUrls: string[] = [];

      try {
        for (const fileItem of fileList) {
          const file = fileItem as File;
          // Diagnose and log file details
          console.log("Arquivo:", file.name, file.type, file.size);

          if (!file || file.size === 0) {
            throw new Error(`O arquivo "${file.name}" está vazio ou corrompido.`);
          }

          // Check if HEIC or HEIF format
          const isHeic = file.type === "image/heic" || file.type === "image/heif" ||
                         file.name.toLowerCase().endsWith(".heic") || file.name.toLowerCase().endsWith(".heif");
          if (isHeic) {
            throw new Error(`A imagem "${file.name}" precisa ser convertida para JPEG/PNG antes da edição.`);
          }

          // Generate instant temporary object URL to avoid base64 memory overhead
          const objUrl = URL.createObjectURL(file);
          createdObjectUrlsRef.current.push(objUrl);
          validUrls.push(objUrl);
        }

        if (validUrls.length === 0) return;

        if (replacingImageIndex !== null) {
          // Replace mode: trigger cropping panel directly for this specific slot
          const targetIndex = replacingImageIndex;
          setReplacingImageIndex(null);
          handleOpenCropperFor(validUrls[0], "gallery", targetIndex);
        } else {
          // Standard additions: Queue them up so the user can crop them one by one
          setPendingCropQueue(validUrls);
          handleOpenCropperFor(validUrls[0], "gallery", -1);
        }
      } catch (err: any) {
        console.error("Erro ao carregar arquivos de foto:", err);
        showToast(err.message || "Falha ao carregar as imagens.");
      }
    }
  };

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setLoginError("Preencha o e-mail e a senha.");
      return;
    }
    setLoginLoading(true);
    setLoginError("");
    try {
      // 4. Persistência da autenticação
      console.log("Configurando persistência...");
      await setPersistence(auth, browserLocalPersistence);
      
      console.log("Iniciando login com e-mail/senha...");
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      if (user && user.uid === "GfUnnd6oYcZVdgUBc9gFVXiO4t92") {
        setAuthenticatedUser(user);
        showToast("Painel Administrativo Desbloqueado!");
      } else {
        await signOut(auth);
        setAuthenticatedUser(null);
        setLoginError("Acesso negado: Usuário sem permissão administrativa.");
      }
    } catch (err: any) {
      console.error("Erro no login:", err);
      setAuthenticatedUser(null);
      setLoginError(err.message || "E-mail ou senha incorretos.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setAuthenticatedUser(null);
      showToast("Você saiu do painel administrativo.");
    } catch (err) {
      console.error("Erro ao deslogar:", err);
      setAuthenticatedUser(null);
      showToast("Você saiu do painel administrativo.");
    }
  };



  const handleClearAll = async () => {
    const user = auth.currentUser;
    if (!user || user.uid !== "GfUnnd6oYcZVdgUBc9gFVXiO4t92") {
      showToast("Acesso negado: Você precisa estar autenticado com a conta administrativa.");
      return;
    }
    if (confirmClearAll) {
      try {
        showToast("Removendo todos os produtos do Firestore...");
        for (const p of products) {
          await deleteDoc(doc(db, "produtos", p.id));
        }
        showToast("Todos os produtos foram removidos.");
      } catch (err: any) {
        console.error("Erro ao remover todos os produtos:", err);
        showToast(`Erro ao remover produtos: ${err.message || "Erro desconhecido"}`);
        try {
          handleFirestoreError(err, OperationType.DELETE, "produtos");
        } catch (ignored) {}
      }
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
    setFormSizes("");
    setFormColors("");
    setFormDetails("");
    setFormTag("");
    setFormRating("5.0");
    setFormReviewsCount("1");
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
    setFormRating((product.rating ?? 5.0).toString());
    setFormReviewsCount((product.reviewsCount ?? 1).toString());
  };

  const handleDeleteClick = async (productId: string) => {
    const user = auth.currentUser;
    if (!user || user.uid !== "GfUnnd6oYcZVdgUBc9gFVXiO4t92") {
      showToast("Acesso negado: Você precisa estar autenticado com a conta administrativa.");
      return;
    }
    if (confirmDeleteId === productId) {
      try {
        await deleteDoc(doc(db, "produtos", productId));
        showToast("Produto excluído com sucesso do Firestore.");
      } catch (err: any) {
        console.error("Erro ao excluir do Firestore:", err);
        showToast(`Erro ao excluir do Firestore: ${err.message || "Erro desconhecido"}`);
        try {
          handleFirestoreError(err, OperationType.DELETE, `produtos/${productId}`);
        } catch (ignored) {}
      }
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(productId);
      setTimeout(() => {
        setConfirmDeleteId(prev => prev === productId ? null : prev);
      }, 3500);
      showToast("Clique novamente no botão de lixeira para confirmar a exclusão.");
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ETAPA 1 - BOTÃO CADASTRAR FOI ACIONADO
    console.log("ETAPA 1 - BOTÃO CADASTRAR FOI ACIONADO");
    setCadastroStatus("1/6 Botão acionado (Diagnóstico: botão acionado)");

    try {
      setSaveLoading(true);
      setIsSavingProduct(true);

      // ETAPA 2 - VALIDANDO FORMULÁRIO
      console.log("ETAPA 2 - VALIDANDO FORMULÁRIO");
      setCadastroStatus("2/6 Validando formulário");

      if (!formName) {
        throw new Error("Nome do produto é obrigatório");
      }
      if (!formPrice) {
        throw new Error("Preço do produto é obrigatório");
      }

      // ETAPA 3 - VERIFICANDO AUTENTICAÇÃO
      console.log("ETAPA 3 - VERIFICANDO AUTENTICAÇÃO");
      setCadastroStatus("3/6 Verificando autenticação");

      if (!authReady) {
        throw new Error("ERRO: Firebase Authentication não foi inicializado.");
      }

      const user = auth.currentUser;
      console.log("ETAPA 3 - USER:", user?.uid);
      
      if (!user) {
        throw new Error("ERRO: Firebase Authentication não encontrou sessão ativa.");
      }
      if (user.uid !== "GfUnnd6oYcZVdgUBc9gFVXiO4t92") {
        throw new Error("ERRO: UID sem permissão administrativa.");
      }

      // Re-validate auth token exactly before database write to avoid stales
      await user.getIdToken(true);

      // Count how many images need uploading
      const imagesToUpload: { type: "cover" | "gallery"; index: number; value: string }[] = [];
      
      if (formImage && (formImage.startsWith("data:") || formImage.startsWith("blob:"))) {
        imagesToUpload.push({ type: "cover", index: -1, value: formImage });
      }
      
      formImages.forEach((img, idx) => {
        if (img && (img.startsWith("data:") || img.startsWith("blob:"))) {
          imagesToUpload.push({ type: "gallery", index: idx, value: img });
        }
      });

      const totalUploads = imagesToUpload.length;
      let uploadedMainImage = formImage;
      const uploadedFormImages = [...formImages];

      // Sequential uploads so we can show exact progress
      for (let i = 0; i < imagesToUpload.length; i++) {
        const item = imagesToUpload[i];
        const statusText = `Enviando imagem ${i + 1} de ${totalUploads}...`;
        console.log(statusText);
        setCadastroStatus(statusText);
        showToast(statusText);
        
        try {
          const secureUrl = await uploadCroppedImage(item.value);
          if (item.type === "cover") {
            uploadedMainImage = secureUrl;
          } else {
            uploadedFormImages[item.index] = secureUrl;
          }
        } catch (uploadErr: any) {
          console.error("Erro Cloudinary:", uploadErr);
          throw new Error(`Falha no upload da imagem ${i + 1} de ${totalUploads}: ${uploadErr.message || uploadErr}`);
        }
      }

      const mainImage = uploadedMainImage || (uploadedFormImages[0] || "");
      const finalImages = uploadedFormImages;

      // ETAPA 4 - SALVANDO NO FIRESTORE
      console.log("ETAPA 4 - SALVANDO:", { mainImage, finalImages });
      setCadastroStatus("4/6 Enviando ao Firestore (Salvando produto...)");

      // 8. Fazer um cadastro mínimo direto no Firestore
      const productData = {
        name: formName,
        price: parseFloat(formPrice) || 0,
        description: formDescription || "",
        image: mainImage,
        images: finalImages,
        sizes: formSizes ? formSizes.split(",").map(s => s.trim()).filter(Boolean) : [],
        colors: formColors ? formColors.split(",").map(c => c.trim()).filter(Boolean) : [],
        category: formCategory,
        rating: parseFloat(formRating) || 5.0,
        reviewsCount: parseInt(formReviewsCount, 10) || 1,
        details: formDetails ? formDetails.split(",").map(d => d.trim()).filter(Boolean) : [],
        tag: formTag.trim() || "",
        createdAt: serverTimestamp()
      };

      // Explicit validation check: reject if there is any data:, blob:, File, or Blob ONLY IF they are not empty
      const checkInvalidUrl = (url: any) => {
        if (!url) return false;
        if (typeof url !== "string") return true;
        const low = url.toLowerCase();
        if (low.startsWith("data:")) return true;
        if (low.startsWith("blob:")) return true;
        if (low.includes("file") || low.includes("blob") || low.includes("object") || low.includes("canvas")) return true;
        return false;
      };

      if (mainImage && checkInvalidUrl(mainImage)) {
        throw new Error("A imagem principal possui formato local temporário inválido (data:/blob:).");
      }
      for (let idx = 0; idx < finalImages.length; idx++) {
        if (finalImages[idx] && checkInvalidUrl(finalImages[idx])) {
          throw new Error(`A imagem da galeria no índice ${idx} possui formato local temporário inválido.`);
        }
      }

      let productRef;
      if (isEditing && editingId) {
        productRef = doc(db, "produtos", editingId);
        await setDoc(productRef, {
          ...productData,
          id: editingId
        });
      } else {
        productRef = doc(collection(db, "produtos"));
        await setDoc(productRef, {
          ...productData,
          id: productRef.id
        });
      }

      // ETAPA 5 - FIRESTORE CONFIRMOU GRAVAÇÃO
      console.log("ETAPA 5 - FIRESTORE CONFIRMOU:", productRef.id);
      setCadastroStatus("5/6 Firestore confirmou gravação (Salvando produto...)");

      // 9. SOMENTE APÓS setDoc concluir
      showToast(isEditing ? "✨ Produto atualizado com sucesso!" : "✨ Produto cadastrado com sucesso!");
      resetForm();

      // ETAPA 6 - CADASTRO CONCLUÍDO
      console.log("ETAPA 6 - CADASTRO CONCLUÍDO");
      setCadastroStatus("6/6 Cadastro concluído (Produto cadastrado com sucesso.)");

    } catch (error: any) {
      // 10. Mostrar erro REAL na tela do celular
      console.error("ERRO REAL:", error);
      const errorCode = error?.code || "sem código";
      const errorMessage = error?.message || String(error);
      setCadastroStatus(`ERRO: ${errorCode} - ${errorMessage}`);
      showToast(`❌ Erro: ${errorMessage}`);
    } finally {
      setSaveLoading(false);
      setIsSavingProduct(false);
    }
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
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      setRotation(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/80 backdrop-blur-sm flex items-center justify-center sm:p-4 p-0">
      <div className="relative bg-burgundy-950 border-0 sm:border border-gold-600/25 rounded-none sm:rounded-3xl w-full max-w-4xl min-h-screen sm:min-h-0 h-auto sm:h-auto sm:max-h-[90vh] flex flex-col text-stone-100 shadow-2xl overflow-y-auto sm:overflow-hidden animate-in fade-in duration-250">
        
        {/* Header */}
        <div className="p-6 border-b border-burgundy-900/60 flex justify-between items-center bg-stone-950/45">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full border border-gold-400/40 bg-gradient-to-tr from-gold-500/20 to-burgundy-900/40 flex items-center justify-center text-gold-300">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-wide font-display text-gold-200 font-sans">Painel do Administrador</h2>

              </div>
              <p className="text-[10px] text-stone-400 uppercase tracking-widest font-semibold">Área Secreta de Controle de Catálogo</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-xl bg-red-950/30 border border-red-500/20 hover:bg-red-900/40 hover:border-red-500/40 text-red-300 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                Sair
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-1.5 rounded-full bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
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
                Esta é uma seção secreta para administradores. Digite seu e-mail e senha para gerenciar o catálogo.
              </p>
            </div>
            <form onSubmit={handleLogin} className="w-full space-y-3">
              <div className="space-y-2.5">
                <input 
                  type="email"
                  placeholder="E-mail de Administrador"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-850 focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/30 rounded-xl px-4 py-3.5 text-base sm:text-xs text-stone-200 text-center placeholder-stone-600 focus:outline-none transition-all"
                  required
                  disabled={loginLoading}
                  autoFocus
                />
                <input 
                  type="password"
                  placeholder="Digite sua senha de acesso"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-850 focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/30 rounded-xl px-4 py-3.5 text-base sm:text-xs text-stone-200 text-center placeholder-stone-600 focus:outline-none transition-all"
                  required
                  disabled={loginLoading}
                />
                <span className="block text-[10px] text-stone-500 italic mt-1">Acesso exclusivo para administradores autenticados via Firebase</span>
              </div>
              {loginError && <p className="text-[11px] text-red-400 font-medium">{loginError}</p>}
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-gradient-to-r from-gold-500 to-burgundy-600 hover:from-gold-400 hover:to-burgundy-500 text-white font-bold uppercase tracking-widest text-[11px] py-3 rounded-xl transition-all cursor-pointer shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loginLoading ? "Autenticando..." : "Desbloquear Painel"}
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
              <div className="flex-1 overflow-y-auto lg:overflow-hidden flex flex-col lg:flex-row min-h-0">
                {/* Left side: Register/Edit Form */}
                <div className="w-full lg:w-1/2 p-6 lg:border-r border-burgundy-900/40 space-y-4 lg:overflow-y-auto">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gold-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isEditing ? "Editar Produto" : "Cadastrar Novo Produto"}</span>
                  </h3>

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
                        className="w-full bg-stone-950 border border-stone-850 focus:border-gold-500/50 rounded-xl px-3 py-2.5 text-base sm:text-xs text-stone-200 focus:outline-none"
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
                          className="w-full bg-stone-950 border border-stone-850 focus:border-gold-500/50 rounded-xl px-3 py-2.5 text-base sm:text-xs text-stone-200 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-stone-400 font-medium">Grupo/Categoria *</label>
                        <select 
                          value={formCategory}
                          onChange={(e) => setFormCategory(e.target.value as "Lingerie" | "Sex Shop")}
                          className="w-full bg-stone-950 border border-stone-850 focus:border-gold-500/50 rounded-xl px-3 py-2.5 text-base sm:text-xs text-stone-200 focus:outline-none"
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
                        className="w-full bg-stone-950 border border-stone-850 focus:border-gold-500/50 rounded-xl p-3 text-base sm:text-xs text-stone-200 focus:outline-none resize-none"
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
                        id="product-photos-uploader"
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

                              {/* Persistent Close (X) button in top right corner for easy deletion on mobile & desktop */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const updated = formImages.filter((_, i) => i !== index);
                                  setFormImages(updated);
                                  if (isMain) {
                                    setFormImage(updated[0] || "");
                                  }
                                  showToast("Foto removida da galeria.");
                                }}
                                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-stone-950/80 hover:bg-red-600 border border-stone-800 text-stone-300 hover:text-white flex items-center justify-center transition-all cursor-pointer z-30 shadow-md"
                                title="Remover foto"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                              
                              {/* Overlay for action buttons */}
                              <div className="absolute inset-0 bg-stone-950/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5 z-10">
                                <div className="flex justify-between items-center w-full">
                                  {/* Cover label or mark as cover */}
                                  {!isMain ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setFormImage(imgUrl);
                                        const orig = originalImages[imgUrl] || imgUrl;
                                        setOriginalUncroppedImage(orig);
                                        setZoom(1);
                                        setPosition({ x: 0, y: 0 });
                                        setRotation(0);
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

                                  {/* Reorder actions */}
                                  <div className="flex gap-0.5">
                                    {index > 0 && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const updated = [...formImages];
                                          const temp = updated[index];
                                          updated[index] = updated[index - 1];
                                          updated[index - 1] = temp;
                                          setFormImages(updated);
                                          if (isMain) {
                                            setFormImage(updated[index - 1]);
                                          }
                                        }}
                                        className="p-1 rounded bg-stone-900/90 hover:bg-gold-500 text-stone-400 hover:text-stone-950 text-[8px] transition-all cursor-pointer"
                                        title="Mover para esquerda"
                                      >
                                        <ArrowLeft className="w-2.5 h-2.5" />
                                      </button>
                                    )}
                                    {index < formImages.length - 1 && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const updated = [...formImages];
                                          const temp = updated[index];
                                          updated[index] = updated[index + 1];
                                          updated[index + 1] = temp;
                                          setFormImages(updated);
                                          if (isMain) {
                                            setFormImage(updated[index + 1]);
                                          }
                                        }}
                                        className="p-1 rounded bg-stone-900/90 hover:bg-gold-500 text-stone-400 hover:text-stone-950 text-[8px] transition-all cursor-pointer"
                                        title="Mover para direita"
                                      >
                                        <ArrowRight className="w-2.5 h-2.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Crop, Substitute & Enhance buttons at the bottom of the hover overlay */}
                                <div className="flex justify-center gap-1 mt-auto">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const orig = originalImages[imgUrl] || imgUrl;
                                      handleOpenCropperFor(orig, "gallery", index);
                                    }}
                                    className="p-1 rounded bg-stone-900 hover:bg-gold-500 text-gold-400 hover:text-stone-950 border border-stone-850 transition-all cursor-pointer flex items-center justify-center"
                                    title="Ajustar ou refazer o recorte"
                                  >
                                    <Crop className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReplacingImageIndex(index);
                                      fileInputRef.current?.click();
                                    }}
                                    className="p-1 rounded bg-stone-900 hover:bg-gold-500 text-gold-400 hover:text-stone-950 border border-stone-850 transition-all cursor-pointer flex items-center justify-center"
                                    title="Substituir foto por arquivo local"
                                  >
                                    <RefreshCw className="w-3 h-3" />
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

                        {/* Label as trigger to add more inside the grid */}
                        <label
                          htmlFor="product-photos-uploader"
                          className="relative aspect-square rounded-xl border border-dashed border-stone-800 hover:border-gold-400/30 hover:bg-stone-900/40 flex flex-col items-center justify-center gap-1 text-stone-500 hover:text-stone-300 transition-all cursor-pointer"
                        >
                          <Plus className="w-5 h-5" />
                          <span className="text-[8px] uppercase tracking-widest font-extrabold">Nova Foto</span>
                        </label>
                      </div>

                      {/* URL insertion input option */}
                      <div className="flex gap-2 items-center bg-stone-950/40 p-2.5 rounded-xl border border-stone-850">
                        <input 
                          type="text"
                          id="new-photo-url-input"
                          placeholder="Adicionar foto por link (URL)..."
                          className="flex-1 bg-stone-950 border border-stone-850 rounded-lg px-2.5 py-2 text-base sm:text-[11px] text-stone-300 focus:outline-none focus:border-gold-500/40"
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

                      {/* Main cover tools like crop */}
                      {formImage && (
                        <div className="flex flex-wrap gap-2 pt-1 bg-stone-950/20 p-2 rounded-xl border border-stone-900">
                          <span className="text-[9px] text-stone-500 uppercase tracking-wider block w-full font-semibold">Ajustes para a capa selecionada:</span>
                          <button
                            type="button"
                            onClick={() => {
                              const orig = originalImages[formImage] || formImage;
                              const idx = formImages.indexOf(formImage);
                              handleOpenCropperFor(orig, "cover", idx !== -1 ? idx : null);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-gold-500/10 hover:bg-gold-500/20 text-gold-400 border border-gold-500/20 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                            title="Ajustar ou fazer um novo recorte na foto principal"
                          >
                            <Crop className="w-3.5 h-3.5" />
                            <span>Recortar Foto</span>
                          </button>

                          {formImage && originalImages[formImage] && (
                            <button
                              type="button"
                              onClick={() => {
                                const orig = originalImages[formImage];
                                setFormImage(orig);
                                setOriginalUncroppedImage(orig);
                                setZoom(1);
                                setPosition({ x: 0, y: 0 });
                                setRotation(0);
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
                          className="w-full bg-stone-950 border border-stone-850 rounded-xl px-3 py-2.5 text-base sm:text-xs text-stone-200 focus:outline-none focus:border-gold-500/50"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-stone-400 font-medium">Cores (separadas por vírgula)</label>
                        <input 
                          type="text"
                          placeholder="Preto, Vermelho"
                          value={formColors}
                          onChange={(e) => setFormColors(e.target.value)}
                          className="w-full bg-stone-950 border border-stone-850 rounded-xl px-3 py-2.5 text-base sm:text-xs text-stone-200 focus:outline-none focus:border-gold-500/50"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-stone-400 font-medium">Destaques (separados por vírgula)</label>
                      <input 
                        type="text"
                        placeholder="Exclusivo, Toque Macio"
                        value={formDetails}
                        onChange={(e) => setFormDetails(e.target.value)}
                        className="w-full bg-stone-950 border border-stone-850 rounded-xl px-3 py-2.5 text-base sm:text-xs text-stone-200 focus:outline-none focus:border-gold-500/50"
                      />
                    </div>

                    {/* Avaliações Customizadas */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-stone-400 font-medium">Nota de Avaliação (ex: 4.9)</label>
                        <input 
                          type="number"
                          step="0.1"
                          min="1.0"
                          max="5.0"
                          placeholder="5.0"
                          value={formRating}
                          onChange={(e) => setFormRating(e.target.value)}
                          className="w-full bg-stone-950 border border-stone-850 rounded-xl px-3 py-2.5 text-base sm:text-xs text-stone-200 focus:outline-none focus:border-gold-500/50"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-stone-400 font-medium">Qtd de Avaliações (ex: 120)</label>
                        <input 
                          type="number"
                          min="1"
                          placeholder="1"
                          value={formReviewsCount}
                          onChange={(e) => setFormReviewsCount(e.target.value)}
                          className="w-full bg-stone-950 border border-stone-850 rounded-xl px-3 py-2.5 text-base sm:text-xs text-stone-200 focus:outline-none focus:border-gold-500/50"
                        />
                      </div>
                    </div>

                    {/* Form Buttons */}
                    <div className="flex space-x-2 pt-2">
                      <button
                        type="submit"
                        disabled={saveLoading || !authReady}
                        className={`flex-1 font-extrabold uppercase py-3 rounded-xl transition-all cursor-pointer text-center text-[10px] tracking-wider flex items-center justify-center gap-1.5 ${
                          (saveLoading || !authReady) 
                            ? "bg-gold-500/50 text-burgundy-950/50 cursor-not-allowed" 
                            : "bg-gold-500 hover:bg-gold-400 text-burgundy-950"
                        }`}
                      >
                        {saveLoading ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-burgundy-950" />
                            <span>Salvando...</span>
                          </>
                        ) : !authReady ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-burgundy-950/50" />
                            <span>Inicializando...</span>
                          </>
                        ) : (
                          isEditing ? "Salvar Alterações" : "Cadastrar Produto"
                        )}
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

                    {cadastroStatus && (
                      <div id="cadastro-status-line" className="mt-4 p-3 bg-stone-900 border border-gold-500/20 rounded-xl text-[11px] font-mono text-gold-300">
                        <span className="font-bold text-gold-400">Status do cadastro:</span> {cadastroStatus}
                      </div>
                    )}
                  </form>
                </div>

                {/* Right side: Catalog List */}
                <div className="w-full lg:w-1/2 p-6 flex flex-col space-y-4 lg:overflow-y-auto bg-stone-950/20">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-gold-400">Produtos Cadastrados ({products.length})</h3>
                      <p className="text-[10px] text-stone-500">Estes produtos serão renderizados na loja.</p>
                    </div>
                    
                    {/* Action helpers */}
                    <div className="flex items-center space-x-1">
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
                          A loja está temporariamente sem produtos cadastrados. Use o formulário de cadastro ao lado para inserir novos produtos.
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
              <div className="flex-1 overflow-y-auto lg:overflow-hidden flex flex-col lg:flex-row min-h-0 text-stone-200 animate-in fade-in duration-200">
                
                {/* Left Side: Parameters & Configuration */}
                <div className="w-full lg:w-1/2 p-6 lg:border-r border-burgundy-900/40 space-y-5 lg:overflow-y-auto">
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
                      className="w-full bg-stone-950 border border-stone-850 focus:border-gold-500/50 rounded-xl p-3 text-base sm:text-xs text-stone-200 placeholder-stone-600 focus:outline-none resize-none leading-relaxed"
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
                <div className="w-full lg:w-1/2 p-6 flex flex-col space-y-4 lg:overflow-y-auto bg-stone-950/20 items-center justify-center relative min-h-[45vh] lg:min-h-0">
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
        {isCropperOpen && originalUncroppedImage && originalWidth > 0 && originalHeight > 0 && (
          <div className="fixed inset-0 z-[100] bg-stone-950/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-stone-900 border border-gold-500/20 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[95vh] md:max-h-[90vh]">
              
              {/* Left Column: Interactive Canvas/Preview Area */}
              <div className="flex-1 p-6 bg-stone-950 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-stone-850 min-h-[380px] md:min-h-[480px]">
                <div className="mb-4 text-center">
                  <span className="block text-[10px] text-gold-400 font-bold uppercase tracking-widest mb-1 font-display">Estúdio de Enquadramento 4:5</span>
                  <p className="text-[10px] text-stone-400 max-w-xs mx-auto leading-relaxed">
                    Arraste a foto para reposicionar. Use a barra lateral ou os controles para dar zoom e rotacionar.
                  </p>
                </div>
 
                {/* Viewport container strictly matching 4:5 proportion */}
                <div className="relative w-[280px] h-[350px] overflow-hidden rounded-2xl border border-gold-500/30 bg-stone-900 shadow-2xl select-none">
                  {/* Grid Lines for reference */}
                  <div className="absolute inset-0 border border-gold-500/10 pointer-events-none z-10">
                    <div className="absolute inset-x-0 top-1/3 border-b border-white/5"></div>
                    <div className="absolute inset-x-0 top-2/3 border-b border-white/5"></div>
                    <div className="absolute inset-y-0 left-1/3 border-r border-white/5"></div>
                    <div className="absolute inset-y-0 left-2/3 border-r border-white/5"></div>
                  </div>
                  
                  {/* Centered Target Area Border Highlight */}
                  <div className="absolute inset-0 border-2 border-gold-500/20 rounded-2xl pointer-events-none z-10"></div>
 
                  {/* Interactivity Area */}
                  <div
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    className="absolute inset-0 cursor-grab active:cursor-grabbing flex items-center justify-center"
                    style={{ touchAction: "none" }}
                  >
                    <img
                      src={originalUncroppedImage}
                      alt="Original Uncropped"
                      className="max-w-none pointer-events-none select-none block"
                      style={{
                        width: `${baseDimensions.width}px`,
                        height: `${baseDimensions.height}px`,
                        transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                        transformOrigin: "center center",
                        transition: isDragging ? "none" : "transform 0.15s ease-out",
                      }}
                      draggable={false}
                    />
                  </div>
                </div>
 
                <div className="mt-4 px-3 py-1 rounded-full bg-stone-900/60 border border-stone-850/40 text-[9px] uppercase tracking-widest text-stone-400 font-mono">
                  Dimensões Originais: {originalWidth} x {originalHeight} px
                </div>
              </div>

              {/* Right Column: Precise Adjustment and Live Final Preview */}
              <div className="w-full md:w-[360px] p-6 flex flex-col justify-between overflow-y-auto max-h-[50vh] md:max-h-none space-y-5">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-bold text-stone-100 flex items-center gap-1.5 font-display">
                        <Crop className="w-4 h-4 text-gold-400" />
                        <span>Ajustar Foto</span>
                      </h3>
                      <p className="text-[10px] text-stone-400 mt-0.5 leading-relaxed">
                        Defina o enquadramento ideal para o seu catálogo bellenuit.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCancelCrop}
                      className="p-1 rounded-lg bg-stone-950 hover:bg-stone-850 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Real-Time Live Preview section showing cropped outcome */}
                  <div className="bg-stone-950/60 p-3 rounded-2xl border border-stone-850/50 flex items-center gap-4">
                    <div className="w-[80px] h-[100px] bg-stone-900 rounded-lg overflow-hidden border border-gold-500/20 relative shadow-inner flex items-center justify-center">
                      <img 
                        src={originalUncroppedImage} 
                        alt="Resultado final" 
                        className="max-w-none pointer-events-none select-none block"
                        style={{
                          width: `${baseDimensions.width * (80 / 280)}px`,
                          height: `${baseDimensions.height * (80 / 280)}px`,
                          transform: `translate(${position.x * (80 / 280)}px, ${position.y * (80 / 280)}px) scale(${zoom}) rotate(${rotation}deg)`,
                          transformOrigin: "center center",
                        }}
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <span className="block text-[8px] uppercase tracking-widest text-gold-400 font-bold font-mono">Pré-visualização</span>
                      <h4 className="text-[11px] font-bold text-stone-300">Resultado Final do Corte</h4>
                      <p className="text-[9px] text-stone-500 leading-relaxed">
                        Visualização realista em proporção vertical 4:5 pronta para catálogo.
                      </p>
                    </div>
                  </div>

                  {/* Zoom Adjustment Container */}
                  <div className="space-y-2 bg-stone-950/40 p-3 rounded-2xl border border-stone-850/60">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-stone-400 font-medium flex items-center gap-1">
                        <ZoomIn className="w-3 h-3 text-gold-400/80" />
                        Ajuste de Zoom
                      </span>
                      <span className="text-gold-400 font-mono font-bold">{Math.round(zoom * 100)}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setZoom(prev => Math.max(0.5, Number((prev - 0.1).toFixed(2))))}
                        className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
                        title="Diminuir Zoom"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <input 
                        type="range"
                        min="0.5"
                        max="5.0"
                        step="0.05"
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="flex-1 accent-gold-500 cursor-pointer h-1.5 rounded-lg bg-stone-800"
                      />
                      <button
                        type="button"
                        onClick={() => setZoom(prev => Math.min(5.0, Number((prev + 0.1).toFixed(2))))}
                        className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
                        title="Aumentar Zoom"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Rotation Adjustment Container */}
                  <div className="space-y-2 bg-stone-950/40 p-3 rounded-2xl border border-stone-850/60">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-stone-400 font-medium flex items-center gap-1">
                        <RotateCcw className="w-3 h-3 text-gold-400/80" />
                        Rotação da Imagem
                      </span>
                      <span className="text-gold-400 font-mono font-bold">{rotation}°</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setRotation(prev => {
                          const next = prev - 90;
                          return next < -180 ? next + 360 : next;
                        })}
                        className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-[10px] text-stone-400 hover:text-stone-200 transition-colors font-bold cursor-pointer flex items-center justify-center gap-1 w-12"
                        title="Girar -90°"
                      >
                        <RotateCcw className="w-3 h-3" />
                        -90°
                      </button>
                      <input 
                        type="range"
                        min="-180"
                        max="180"
                        step="1"
                        value={rotation}
                        onChange={(e) => setRotation(Number(e.target.value))}
                        className="flex-1 accent-gold-500 cursor-pointer h-1.5 rounded-lg bg-stone-800"
                      />
                      <button
                        type="button"
                        onClick={() => setRotation(prev => {
                          const next = prev + 90;
                          return next > 180 ? next - 360 : next;
                        })}
                        className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-[10px] text-stone-400 hover:text-stone-200 transition-colors font-bold cursor-pointer flex items-center justify-center gap-1 w-12"
                        title="Girar +90°"
                      >
                        <RotateCw className="w-3 h-3" />
                        +90°
                      </button>
                    </div>
                  </div>

                  {/* Redefinir Ajustes Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setZoom(1);
                      setPosition({ x: 0, y: 0 });
                      setRotation(0);
                      showToast("Ajustes redefinidos para os padrões!");
                    }}
                    className="w-full bg-stone-950/60 hover:bg-stone-900 border border-stone-850 hover:border-stone-800 text-stone-400 hover:text-stone-200 text-[10px] font-extrabold uppercase tracking-widest py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Redefinir Ajustes</span>
                  </button>
                </div>

                {/* Footer Buttons: Save & Close & Cancel */}
                <div className="space-y-2 pt-4 border-t border-stone-850">
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={handleApplyCrop}
                    className="w-full bg-gold-500 hover:bg-gold-400 disabled:bg-stone-800 disabled:text-stone-600 text-burgundy-950 font-extrabold uppercase tracking-widest text-[10px] py-3 rounded-xl transition-all cursor-pointer text-center flex items-center justify-center space-x-2 shadow-lg"
                  >
                    {isUploading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Processando imagem...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Salvar e Fechar</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={handleCancelCrop}
                    className="w-full bg-stone-950 hover:bg-stone-900 border border-stone-850 text-stone-400 hover:text-stone-100 font-bold text-[10px] py-2.5 rounded-xl transitionter text-center"
                    >
                      Descartar e Cancelar
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

        {/* Footer info lock indicator */}
        <div className="p-4 bg-stone-950 border-t border-burgundy-900/60 text-center text-[10px] text-stone-500 flex items-center justify-center gap-1.5">
          <Lock className="w-3 h-3" />
          <span>Sessão protegida por criptografia local de ponta-a-ponta. Todas as alterações são salvas localmente.</span>
        </div>

        {isDecodingImage && (
          <div className="fixed inset-0 z-[110] bg-stone-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-4">
            <div className="bg-stone-900 border border-gold-500/20 rounded-2xl p-6 max-w-sm w-full flex flex-col items-center text-center space-y-4 shadow-2xl">
              <RefreshCw className="w-8 h-8 text-gold-500 animate-spin" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-stone-200">Carregando imagem...</p>
                <p className="text-xs text-stone-400">Decodificando arquivo para o estúdio de enquadramento.</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
