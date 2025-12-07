import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  Home,
  Loader2,
  Upload,
  Trash2,
  Image as ImageIcon,
  Video,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Admin() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"photo" | "video">("photo");
  const [isPublic, setIsPublic] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");

  const { data: content, isLoading: contentLoading } = trpc.content.list.useQuery();
  const { data: stats } = trpc.content.stats.useQuery();
  
  const uploadMutation = trpc.content.upload.useMutation({
    onSuccess: () => {
      toast.success("Conteúdo enviado com sucesso!");
      // Limpar formulário
      setTitle("");
      setDescription("");
      setFile(null);
      setPreview("");
      // Atualizar lista
      utils.content.list.invalidate();
      utils.content.stats.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao enviar conteúdo");
    },
  });

  const deleteMutation = trpc.content.delete.useMutation({
    onSuccess: () => {
      toast.success("Conteúdo deletado com sucesso!");
      utils.content.list.invalidate();
      utils.content.stats.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao deletar conteúdo");
    },
  });

  // Redirecionar se não for admin
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "admin")) {
      toast.error("Acesso negado. Apenas administradores.");
      setLocation("/");
    }
  }, [authLoading, isAuthenticated, user, setLocation]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Criar preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Selecione um arquivo");
      return;
    }

    try {
      // Converter arquivo para base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        
        await uploadMutation.mutateAsync({
          title: title || undefined,
          description: description || undefined,
          type,
          fileData: base64,
          mimeType: file.type,
          isPublic,
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
    }
  };

  const handleDelete = async (contentId: number) => {
    if (confirm("Tem certeza que deseja deletar este conteúdo?")) {
      await deleteMutation.mutateAsync({ contentId });
    }
  };

  if (authLoading || !isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-purple-600">
            Painel Administrativo
          </h1>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => setLocation("/")}
              className="text-gray-700 hover:text-purple-600"
            >
              <Home className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation("/content")}
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              Ver Conteúdo
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-1">
              {stats?.total || 0}
            </div>
            <div className="text-sm text-gray-600">Total de Mídias</div>
          </Card>
          <Card className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-pink-600 mb-1">
              {stats?.photos || 0}
            </div>
            <div className="text-sm text-gray-600">Fotos</div>
          </Card>
          <Card className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-rose-600 mb-1">
              {stats?.videos || 0}
            </div>
            <div className="text-sm text-gray-600">Vídeos</div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Form */}
          <Card className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Upload className="w-6 h-6 text-purple-600" />
              Upload de Conteúdo
            </h2>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <Label htmlFor="title">Título (opcional)</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Ensaio Praia"
                  className="mt-1"
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Adicione uma descrição..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              {/* Type */}
              <div>
                <Label htmlFor="type">Tipo</Label>
                <Select
                  value={type}
                  onValueChange={(value) => setType(value as "photo" | "video")}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="photo">Foto</SelectItem>
                    <SelectItem value="video">Vídeo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* File Upload */}
              <div>
                <Label htmlFor="file">Arquivo</Label>
                <Input
                  id="file"
                  type="file"
                  accept={type === "photo" ? "image/*" : "video/*"}
                  onChange={handleFileChange}
                  className="mt-1"
                />
              </div>

              {/* Preview */}
              {preview && (
                <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
                  {type === "photo" ? (
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      src={preview}
                      controls
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              )}

              {/* Public Toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <Label htmlFor="isPublic" className="cursor-pointer">
                  Tornar público (visível sem assinatura)
                </Label>
              </div>

              {/* Upload Button */}
              <Button
                onClick={handleUpload}
                disabled={!file || uploadMutation.isPending}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Enviar Conteúdo
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Content List */}
          <Card className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Conteúdo Publicado
            </h2>

            {contentLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              </div>
            ) : content && content.length > 0 ? (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {content.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    {/* Thumbnail */}
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-200 to-pink-200 rounded-lg overflow-hidden flex-shrink-0">
                      {item.type === "photo" ? (
                        <img
                          src={item.fileUrl}
                          alt={item.title || "Foto"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Video className="w-6 h-6 text-purple-600" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {item.type === "photo" ? (
                          <ImageIcon className="w-4 h-4 text-pink-600" />
                        ) : (
                          <Video className="w-4 h-4 text-purple-600" />
                        )}
                        <span className="font-medium text-gray-900 truncate">
                          {item.title || "Sem título"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                        {item.isPublic === 1 && (
                          <span className="ml-2 text-green-600">• Público</span>
                        )}
                      </p>
                    </div>

                    {/* Delete Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                      disabled={deleteMutation.isPending}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                Nenhum conteúdo publicado ainda
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
