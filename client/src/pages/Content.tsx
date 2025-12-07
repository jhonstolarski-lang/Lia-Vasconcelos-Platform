import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Home, Lock, Loader2, Image as ImageIcon, Video } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Content() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();
  
  const { data: activeSubscription, isLoading: subLoading } = trpc.subscription.getActive.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  
  const { data: content, isLoading: contentLoading } = trpc.content.list.useQuery();
  const { data: stats } = trpc.content.stats.useQuery();

  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [authLoading, isAuthenticated]);

  const handleLogout = async () => {
    await logout();
    toast.success("Logout realizado com sucesso!");
    setLocation("/");
  };

  const handleGoHome = () => {
    setLocation("/");
  };

  const handleSubscribe = () => {
    setLocation("/?plan=1_month");
  };

  if (authLoading || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  const hasActiveSubscription = !!activeSubscription;

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-rose-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-rose-600">Lia Vasconcelos</h1>
            {user?.role === "admin" && (
              <Button
                variant="outline"
                onClick={() => setLocation("/admin")}
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                Admin
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={handleGoHome}
              className="text-gray-700 hover:text-rose-600"
            >
              <Home className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-rose-300 text-rose-700 hover:bg-rose-50"
            >
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* User Info */}
        <Card className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                Olá, {user?.name}!
              </h2>
              <p className="text-gray-600">{user?.email}</p>
            </div>
            {hasActiveSubscription ? (
              <div className="text-right">
                <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-semibold">
                  ✓ Assinatura Ativa
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Válida até{" "}
                  {new Date(activeSubscription.endDate!).toLocaleDateString("pt-BR")}
                </p>
              </div>
            ) : (
              <div className="text-right">
                <div className="bg-orange-100 text-orange-700 px-4 py-2 rounded-full font-semibold">
                  Sem Assinatura
                </div>
                <Button
                  onClick={handleSubscribe}
                  className="mt-2 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white"
                >
                  Assinar Agora
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-rose-600 mb-1">
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
            <div className="text-3xl font-bold text-purple-600 mb-1">
              {stats?.videos || 0}
            </div>
            <div className="text-sm text-gray-600">Vídeos</div>
          </Card>
        </div>

        {/* Content Grid */}
        {contentLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
          </div>
        ) : !hasActiveSubscription ? (
          // Sem assinatura - mostrar conteúdo bloqueado
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-12 h-12 text-rose-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Conteúdo Exclusivo
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Assine agora para ter acesso ilimitado a todas as fotos e vídeos
              exclusivos da Lia Vasconcelos
            </p>
            <Button
              onClick={handleSubscribe}
              className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-full px-8 py-6 text-lg"
            >
              Ver Planos de Assinatura
            </Button>
          </div>
        ) : content && content.length > 0 ? (
          // Com assinatura - mostrar conteúdo
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Conteúdo Exclusivo
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {content.map((item) => (
                <Card
                  key={item.id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className="relative aspect-square bg-gradient-to-br from-rose-200 to-pink-200">
                    {item.type === "photo" ? (
                      <img
                        src={item.fileUrl}
                        alt={item.title || "Foto"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video
                        src={item.fileUrl}
                        controls
                        className="w-full h-full object-cover"
                        poster={item.thumbnailUrl || undefined}
                      />
                    )}
                    <div className="absolute top-3 right-3">
                      <div className="bg-white/90 backdrop-blur-sm rounded-full p-2">
                        {item.type === "photo" ? (
                          <ImageIcon className="w-4 h-4 text-rose-600" />
                        ) : (
                          <Video className="w-4 h-4 text-purple-600" />
                        )}
                      </div>
                    </div>
                  </div>
                  {(item.title || item.description) && (
                    <div className="p-4">
                      {item.title && (
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {item.title}
                        </h4>
                      )}
                      {item.description && (
                        <p className="text-sm text-gray-600">
                          {item.description}
                        </p>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        ) : (
          // Com assinatura mas sem conteúdo ainda
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ImageIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Nenhum conteúdo disponível ainda
            </h3>
            <p className="text-gray-600">
              Novos conteúdos serão adicionados em breve!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
