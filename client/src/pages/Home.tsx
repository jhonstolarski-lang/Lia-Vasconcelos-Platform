import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Instagram, Lock } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { data: stats } = trpc.content.stats.useQuery();
  const { data: activeSubscription } = trpc.subscription.getActive.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const plans = [
    {
      id: "1_month",
      name: "1 mês",
      discount: "30% off",
      price: "R$ 19,90",
      value: 1990,
    },
    {
      id: "3_months",
      name: "3 meses",
      discount: "39% off",
      price: "R$ 29,90",
      value: 2990,
      badge: "Promoção",
    },
    {
      id: "6_months",
      name: "6 meses",
      discount: "75% off",
      price: "R$ 59,90",
      value: 5990,
      badge: "Promoção",
    },
  ];

  const handleSubscribe = (planType: string) => {
    setLocation(`/checkout?plan=${planType}`);
  };

  const handleViewContent = () => {
    setLocation("/content");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-rose-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-rose-600">Lia Vasconcelos</h1>
          {isAuthenticated ? (
            <Button
              variant="outline"
              onClick={handleViewContent}
              className="border-rose-300 text-rose-700 hover:bg-rose-50"
            >
              {activeSubscription ? "Ver Conteúdo" : "Minha Conta"}
            </Button>
          ) : (
            <Button
              variant="default"
              onClick={() => (window.location.href = "/api/auth/oauth")}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Entrar
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Profile Section */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-6">
          {/* Cover Image */}
          <div className="h-48 bg-gradient-to-r from-rose-400 via-pink-400 to-orange-400 relative overflow-hidden">
            <img
              src="/cover.jpg"
              alt="Capa"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/10"></div>
          </div>

          {/* Profile Info */}
          <div className="relative px-6 pb-6">
            {/* Avatar */}
            <div className="flex justify-center -mt-16 mb-4">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 p-1 shadow-lg">
                <img
                  src="/profile.jpg"
                  alt="Lia Vasconcelos"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
            </div>

            {/* Stats Badge */}
            <div className="flex justify-center mb-4">
              <div className="bg-rose-100 text-rose-700 px-4 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                <Lock className="w-4 h-4" />
                {stats?.total || 0} Mídias
              </div>
            </div>

            {/* Name and Bio */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                Lia Vasconcelos
              </h2>
              <p className="text-gray-600 mb-3">@liavasconcelos</p>
              <p className="text-lg text-gray-700">
                Estou aqui justamente para satisfazer você bb ❤️
              </p>
            </div>

            {/* Instagram Link */}
            <div className="flex justify-center mb-6">
              <a
                href="https://instagram.com/liavasconcelos"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-rose-600 hover:text-rose-700 transition-colors"
              >
                <Instagram className="w-5 h-5" />
                <span className="font-medium">@liavasconcelos</span>
              </a>
            </div>

            {/* Subscription Plans */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 text-center">
                Assinaturas
              </h3>

              {plans.map((plan, index) => (
                <div key={plan.id}>
                  {index === 1 && (
                    <div className="text-center mb-2">
                      <span className="text-sm font-medium text-orange-600">
                        Promoções
                      </span>
                    </div>
                  )}
                  <Card className="p-4 border-2 border-rose-200 hover:border-rose-400 transition-all hover:shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">
                            {plan.name}
                          </span>
                          <span className="text-sm bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                            {plan.discount}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xl font-bold text-rose-600">
                          {plan.price}
                        </span>
                        <Button
                          onClick={() => handleSubscribe(plan.id)}
                          className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-full px-6"
                        >
                          Assinar
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>

            {/* Content Stats */}
            <div className="mt-6 flex gap-4 justify-center">
              <Card className="flex-1 p-4 text-center border-rose-200">
                <div className="text-2xl font-bold text-rose-600">
                  {stats?.photos || 0}
                </div>
                <div className="text-sm text-gray-600">Fotos</div>
              </Card>
              <Card className="flex-1 p-4 text-center border-rose-200">
                <div className="text-2xl font-bold text-rose-600">
                  {stats?.videos || 0}
                </div>
                <div className="text-sm text-gray-600">Vídeos</div>
              </Card>
            </div>
          </div>
        </div>

        {/* Sample Content Preview */}
        <div className="bg-white rounded-3xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Conteúdo Exclusivo
            </h3>
          </div>
          <div className="relative aspect-square bg-gradient-to-br from-rose-200 to-pink-200 rounded-2xl overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm bg-white/30">
              <div className="text-center">
                <Lock className="w-16 h-16 text-rose-500 mx-auto mb-4" />
                <p className="text-gray-700 font-medium mb-2">
                  Conteúdo Bloqueado
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Assine para ter acesso completo
                </p>
                <Button
                  onClick={() => handleSubscribe("1_month")}
                  className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-full"
                >
                  Ver Planos
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-rose-100 mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          <p>© 2024 Lia Vasconcelos. Todos os direitos reservados.</p>
          <div className="mt-2 flex justify-center gap-4">
            <a href="/privacy" className="hover:text-rose-600 transition-colors">
              Política de Privacidade
            </a>
            <a href="/terms" className="hover:text-rose-600 transition-colors">
              Termos de Uso
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
