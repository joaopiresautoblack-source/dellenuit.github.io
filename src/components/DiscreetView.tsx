import React, { useState } from "react";
import { 
  FileText, 
  TrendingUp, 
  Users, 
  Download, 
  Search, 
  Calendar, 
  RefreshCw, 
  ShieldAlert, 
  CheckCircle,
  HelpCircle,
  ArrowRightLeft
} from "lucide-react";

interface DiscreetViewProps {
  onDisable: () => void;
}

export default function DiscreetView({ onDisable }: DiscreetViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const simulateRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 800);
  };

  const dummyData = [
    { code: "PRJ-2026-A", desc: "Ajuste Tarifário de Custos Indiretos", dept: "Controladoria", value: "R$ 45.240,00", date: "14/07/2026", status: "Aprovado" },
    { code: "PRJ-2026-B", desc: "Consolidação de Insumos Terceirizados", dept: "Operações", value: "R$ 112.890,50", date: "13/07/2026", status: "Aprovado" },
    { code: "PRJ-2026-C", desc: "Provisão de Encargos Trabalhistas", dept: "Recursos Humanos", value: "R$ 84.150,00", date: "10/07/2026", status: "Pendente" },
    { code: "PRJ-2026-D", desc: "Amortização de Ativos Imobiliários", dept: "Financeiro", value: "R$ 12.400,00", date: "09/07/2026", status: "Aprovado" },
    { code: "PRJ-2026-E", desc: "Auditoria de Balancete de Verificação", dept: "Compliance", value: "R$ 0,00", date: "08/07/2026", status: "Revisão" }
  ];

  return (
    <div id="discreet-view" className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Top Professional Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center text-white font-bold text-sm">
            S
          </div>
          <div>
            <h1 className="text-md font-semibold tracking-tight text-slate-900">
              SIGMA - Sistema Integrado de Auditoria Orçamentária
            </h1>
            <p className="text-xs text-slate-500">
              Módulo de Governança Corporativa • Licença de Uso Acadêmico/Profissional
            </p>
          </div>
        </div>

        {/* Secret exit disguised as "Sair do Sistema" or "Logoff" */}
        <div className="flex items-center space-x-4">
          <div className="text-xs text-slate-500 text-right hidden sm:block">
            <span className="font-medium text-slate-700">Auditor:</span> joaopires.autoblack@gmail.com
            <p className="text-[10px]">Última sincronização: 14/07/2026 às 11:15</p>
          </div>
          <button 
            id="exit-discreet-btn"
            onClick={onDisable}
            className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer border border-slate-200"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Sair do Sistema</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
            <div className="flex justify-between items-start text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Orc. Previsto Anual</span>
              <FileText className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900">R$ 1.840.000</span>
              <span className="text-xs text-green-600 block mt-1 font-medium">↑ 4.2% em relação a 2025</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
            <div className="flex justify-between items-start text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Despesas Liquidadas</span>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900">R$ 642.158,54</span>
              <span className="text-xs text-slate-500 block mt-1">34.9% do teto planejado</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
            <div className="flex justify-between items-start text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Projetos em Auditoria</span>
              <ShieldAlert className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900">12 Ativos</span>
              <span className="text-xs text-amber-600 block mt-1 font-medium">3 necessitam atenção urgente</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
            <div className="flex justify-between items-start text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Membros do Comitê</span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900">7 Diretores</span>
              <span className="text-xs text-green-600 block mt-1 font-medium">Sessão criptografada ativa</span>
            </div>
          </div>
        </div>

        {/* Charts & Search Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Simulated Line Chart (using simple SVG) */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs lg:col-span-1">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-slate-900">Variação de Despesas Trimestrais</h3>
              <Calendar className="w-4 h-4 text-slate-400" />
            </div>
            <div className="h-44 flex flex-col justify-between">
              <div className="w-full h-32 flex items-end justify-between px-2 pt-4 relative">
                {/* SVG Graph */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path
                    d="M 10 80 Q 30 50 50 65 T 90 20"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="3"
                  />
                  <circle cx="10" cy="80" r="3" fill="#2563eb" />
                  <circle cx="50" cy="65" r="3" fill="#2563eb" />
                  <circle cx="90" cy="20" r="3" fill="#2563eb" />
                </svg>
                {/* Grid guidelines */}
                <div className="absolute inset-x-0 bottom-1/4 border-b border-dashed border-slate-100"></div>
                <div className="absolute inset-x-0 bottom-2/4 border-b border-dashed border-slate-100"></div>
                <div className="absolute inset-x-0 bottom-3/4 border-b border-dashed border-slate-100"></div>

                <div className="text-[10px] text-slate-400 z-10">T1</div>
                <div className="text-[10px] text-slate-400 z-10">T2</div>
                <div className="text-[10px] text-slate-400 z-10">T3</div>
                <div className="text-[10px] text-slate-400 z-10">T4 (Projetado)</div>
              </div>
              <div className="flex justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
                <span>Meta de Despesa</span>
                <span className="font-bold text-slate-700">R$ 500.000,00</span>
              </div>
            </div>
          </div>

          {/* Core Table and Filtering */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs lg:col-span-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Lançamentos de Contabilidade</h3>
                <p className="text-xs text-slate-500">Mostrando os últimos lançamentos do livro razão</p>
              </div>
              <div className="flex space-x-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Filtrar lançamentos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
                <button 
                  onClick={simulateRefresh}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 p-1.5 rounded-md cursor-pointer"
                  title="Atualizar dados"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-medium">
                    <th className="py-2.5 px-3">Código</th>
                    <th className="py-2.5 px-3">Descrição da Atividade</th>
                    <th className="py-2.5 px-3">Departamento</th>
                    <th className="py-2.5 px-3 text-right">Valor</th>
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dummyData
                    .filter(item => 
                      item.desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      item.dept.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((row) => (
                      <tr key={row.code} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-slate-500 font-medium">{row.code}</td>
                        <td className="py-2.5 px-3 text-slate-700">{row.desc}</td>
                        <td className="py-2.5 px-3 text-slate-600">{row.dept}</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-slate-900">{row.value}</td>
                        <td className="py-2.5 px-3 text-slate-500">{row.date}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            row.status === "Aprovado" 
                              ? "bg-green-100 text-green-700" 
                              : row.status === "Pendente" 
                              ? "bg-amber-100 text-amber-700" 
                              : "bg-blue-100 text-blue-700"
                          }`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-between items-center text-xs text-slate-500 border-t border-slate-100 pt-3">
              <span>Exibindo de 1 a {dummyData.length} lançamentos</span>
              <button className="flex items-center space-x-1.5 hover:text-slate-800 font-medium cursor-pointer">
                <Download className="w-3.5 h-3.5" />
                <span>Exportar XLS</span>
              </button>
            </div>
          </div>
        </div>

        {/* Notices Section */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex space-x-3 items-start">
          <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-800">
            <span className="font-bold">Política de Segurança da Informação:</span> Este terminal utiliza tokens criptográficos rotativos. Certifique-se de realizar o logoff apropriado ao deixar a estação de trabalho para evitar que as credenciais fiquem salvas no cache do navegador local.
          </div>
        </div>
      </main>

      <footer className="bg-slate-100 border-t border-slate-200 mt-12 py-6 text-center text-xs text-slate-400">
        <p>© 2026 SIGMA Governança & Auditoria. Conexão SSL segura AES-256 bits.</p>
      </footer>
    </div>
  );
}
