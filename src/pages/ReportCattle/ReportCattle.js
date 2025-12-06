import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import { getWeightReport, getPerformanceReport } from '../../services/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import './ReportCattle.css';

const statusColorMap = {
  'Meta atingida': 'status-success',
  'Alerta: perda de peso': 'status-danger',
  'Em progresso': 'status-warning',
  'Sem dados suficientes': 'status-muted',
  'Acompanhamento em progresso': 'status-info'
};

const trendIconMap = {
  up: '▲',
  down: '▼',
  stable: '■'
};

// Mapeamento de cores para status de desempenho
const performanceStatusColorMap = {
  'Excelente': 'performance-excellent',
  'Bom': 'performance-good',
  'Regular': 'performance-regular',
  'Crítico': 'performance-critical',
  'Sem dados': 'performance-nodata'
};

const ReportCattle = () => {
  const [report, setReport] = useState(null);
  const [performanceReport, setPerformanceReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('weight'); // 'weight' ou 'performance'

  const loadReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const [weightData, performanceData] = await Promise.all([
        getWeightReport(),
        getPerformanceReport()
      ]);
      setReport(weightData);
      setPerformanceReport(performanceData);
    } catch (err) {
      setError(err.message || 'Erro ao gerar relatório.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const renderSummaryCard = (title, value, description) => (
    <div className="report-summary-card">
      <div className="report-summary-title">{title}</div>
      <div className="report-summary-value">{value ?? '—'}</div>
      {description && <div className="report-summary-description">{description}</div>}
    </div>
  );

  const renderStatusPill = (status) => {
    const normalized = statusColorMap[status] ? status : 'Sem dados suficientes';
    return <span className={`status-pill ${statusColorMap[normalized] || statusColorMap['Sem dados suficientes']}`}>{status}</span>;
  };

  // Função para exportar relatório de desempenho para PDF
  const exportPerformanceToPDF = () => {
    if (!performanceReport || !performanceReport.animals) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Título
    doc.setFontSize(18);
    doc.setTextColor(44, 62, 80);
    doc.text('BoviCare - Relatório de Desempenho (Engorda)', pageWidth / 2, 20, { align: 'center' });

    // Data de geração
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth / 2, 28, { align: 'center' });

    // Resumo
    if (performanceReport.summary) {
      doc.setFontSize(12);
      doc.setTextColor(44, 62, 80);
      doc.text('Resumo:', 14, 40);
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(`Total de animais: ${performanceReport.summary.total}`, 14, 48);
      doc.text(`Excelente: ${performanceReport.summary.excellent} | Bom: ${performanceReport.summary.good} | Regular: ${performanceReport.summary.regular} | Crítico: ${performanceReport.summary.critical}`, 14, 54);
      doc.text(`GMD Médio: ${performanceReport.summary.average_gmd ?? '—'} kg/dia`, 14, 60);
    }

    // Dados da tabela
    const tableData = performanceReport.animals.map(animal => [
      animal.id,
      animal.breed || 'N/A',
      animal.previous_weight != null ? `${animal.previous_weight} kg` : '—',
      animal.current_weight != null ? `${animal.current_weight} kg` : '—',
      animal.weight_gain != null ? `+${animal.weight_gain} kg` : '—',
      animal.gmd != null ? animal.gmd.toFixed(3) : '—',
      animal.status
    ]);

    // Configuração de cores por status
    const getStatusColor = (status) => {
      switch (status) {
        case 'Excelente': return [212, 237, 218]; // Verde
        case 'Bom': return [226, 227, 229]; // Cinza
        case 'Regular': return [255, 243, 205]; // Amarelo
        case 'Crítico': return [248, 215, 218]; // Vermelho
        default: return [255, 255, 255];
      }
    };

    autoTable(doc, {
      startY: 70,
      head: [['ID', 'Raça', 'Peso Ant.', 'Peso Atual', 'Ganho', 'GMD', 'Status']],
      body: tableData,
      headStyles: {
        fillColor: [44, 62, 80],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        halign: 'center'
      },
      didParseCell: function(data) {
        if (data.section === 'body') {
          const rowIndex = data.row.index;
          const animal = performanceReport.animals[rowIndex];
          if (animal) {
            data.cell.styles.fillColor = getStatusColor(animal.status);
          }
        }
      },
      styles: {
        fontSize: 9,
        cellPadding: 4
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 25 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 22 },
        5: { cellWidth: 20 },
        6: { cellWidth: 25 }
      }
    });

    doc.save('relatorio-desempenho-bovicare.pdf');
  };

  // Função para exportar relatório de desempenho para Excel
  const exportPerformanceToExcel = () => {
    if (!performanceReport || !performanceReport.animals) return;

    // Preparar dados
    const excelData = performanceReport.animals.map(animal => ({
      'ID': animal.id,
      'Nome': animal.name || '—',
      'Raça': animal.breed || 'N/A',
      'Peso Anterior (kg)': animal.previous_weight ?? '—',
      'Peso Atual (kg)': animal.current_weight ?? '—',
      'Ganho (kg)': animal.weight_gain ?? '—',
      'GMD (kg/dia)': animal.gmd ?? '—',
      'Status': animal.status
    }));

    // Criar workbook
    const wb = XLSX.utils.book_new();

    // Adicionar resumo no início
    const summaryData = [
      ['BoviCare - Relatório de Desempenho (Engorda)'],
      [`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`],
      [],
      ['Resumo:'],
      [`Total de animais: ${performanceReport.summary?.total || 0}`],
      [`Excelente: ${performanceReport.summary?.excellent || 0}`],
      [`Bom: ${performanceReport.summary?.good || 0}`],
      [`Regular: ${performanceReport.summary?.regular || 0}`],
      [`Crítico: ${performanceReport.summary?.critical || 0}`],
      [`GMD Médio: ${performanceReport.summary?.average_gmd ?? '—'} kg/dia`],
      []
    ];

    const wsData = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Adicionar dados da tabela após o resumo
    XLSX.utils.sheet_add_json(wsData, excelData, { origin: 'A12' });

    // Ajustar largura das colunas
    wsData['!cols'] = [
      { wch: 10 }, // ID
      { wch: 20 }, // Nome
      { wch: 15 }, // Raça
      { wch: 18 }, // Peso Anterior
      { wch: 18 }, // Peso Atual
      { wch: 12 }, // Ganho
      { wch: 15 }, // GMD
      { wch: 12 }  // Status
    ];

    XLSX.utils.book_append_sheet(wb, wsData, 'Desempenho');
    XLSX.writeFile(wb, 'relatorio-desempenho-bovicare.xlsx');
  };

  if (loading) {
    return (
      <div className="report-cattle-container">
        <Navbar />
        <div className="report-content loading-state">
          <div className="spinner" />
          <p>Gerando relatório automático...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="report-cattle-container">
        <Navbar />
        <div className="report-content error-state">
          <p>{error}</p>
          <button onClick={loadReport} className="reload-button">Tentar novamente</button>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="report-cattle-container">
        <Navbar />
        <div className="report-content empty-state">
          <p>Nenhum dado disponível para o relatório.</p>
        </div>
      </div>
    );
  }

  const { summary, alerts, animals } = report;

  return (
    <div className="report-cattle-container">
      <Navbar />
      <div className="report-content">
        <header className="report-header">
          <div>
            <h1>Relatórios</h1>
            <p>Acompanhamento completo do seu rebanho.</p>
          </div>
          <button className="reload-button" onClick={loadReport}>Atualizar relatório</button>
        </header>

        {/* Tabs para alternar entre relatórios */}
        <div className="report-tabs">
          <button
            className={`report-tab ${activeTab === 'weight' ? 'active' : ''}`}
            onClick={() => setActiveTab('weight')}
          >
            Relatório de Peso
          </button>
          <button
            className={`report-tab ${activeTab === 'performance' ? 'active' : ''}`}
            onClick={() => setActiveTab('performance')}
          >
            Relatório de Desempenho (Engorda)
          </button>
        </div>

        {/* Conteúdo do tab de Peso */}
        {activeTab === 'weight' && (
          <>
            <section className="report-summary">
              {renderSummaryCard('Total de gados monitorados', summary.totalCattle, 'Animais com pelo menos uma pesagem registrada.')}
              {renderSummaryCard('Com meta cadastrada', summary.withTarget, 'Animais que possuem objetivo de peso definido.')}
              {renderSummaryCard('Meta atingida', summary.reachedTarget, 'Animais que já alcançaram o peso de abate.')}
              {renderSummaryCard('Perdendo peso', summary.losingWeight, 'Animais com tendência de queda e que exigem atenção imediata.')}
              {renderSummaryCard('Sem dados de peso', summary.withoutData, 'Animais sem pesagens registradas ou sem meta definida.')}
              {renderSummaryCard('Peso médio atual', summary.averageWeight ? `${summary.averageWeight} kg` : '—', 'Média do peso atual considerando animais com pesagem recente.')}
            </section>

            <section className="report-alerts">
              <div className="section-header">
                <h2>Alertas prioritários</h2>
                <span>{alerts.length} alerta(s)</span>
              </div>
              {alerts.length === 0 ? (
                <div className="alert-empty">Nenhum alerta no momento. Continue monitorando o rebanho.</div>
              ) : (
                <div className="alert-grid">
                  {alerts.map((animal) => (
                    <div key={animal.id} className="alert-card">
                      <div className="alert-card-header">
                        <span className="alert-name">{animal.name}</span>
                        {renderStatusPill(animal.status)}
                      </div>
                      <div className="alert-details">
                        <div>
                          <span className="info-label">Peso atual</span>
                          <span className="info-value">{animal.currentWeight ?? '—'} kg</span>
                        </div>
                        <div>
                          <span className="info-label">Meta</span>
                          <span className="info-value">{animal.targetWeight ?? '—'} kg</span>
                        </div>
                        <div>
                          <span className="info-label">Diferença para meta</span>
                          <span className="info-value">{animal.differenceToTarget != null ? `${animal.differenceToTarget} kg` : '—'}</span>
                        </div>
                        <div>
                          <span className="info-label">Última pesagem</span>
                          <span className="info-value">{animal.lastWeighingDate ? new Date(animal.lastWeighingDate).toLocaleDateString('pt-BR') : '—'}</span>
                        </div>
                      </div>
                      <p className="alert-message">{animal.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="report-animal-list">
              <div className="section-header">
                <h2>Detalhes por animal</h2>
                <span>{animals.length} registro(s)</span>
              </div>
              <div className="animal-table">
                <div className="animal-table-header">
                  <span>Animal</span>
                  <span>Peso atual</span>
                  <span>Meta</span>
                  <span>Diferença</span>
                  <span>% atingido</span>
                  <span>Tendência</span>
                  <span>Status</span>
                </div>
                {animals.map((animal) => (
                  <div key={animal.id} className="animal-table-row">
                    <span className="animal-name">{animal.name}</span>
                    <span>{animal.currentWeight != null ? `${animal.currentWeight} kg` : '—'}</span>
                    <span>{animal.targetWeight != null ? `${animal.targetWeight} kg` : '—'}</span>
                    <span>{animal.differenceToTarget != null ? `${animal.differenceToTarget} kg` : '—'}</span>
                    <span>{animal.percentageToTarget != null ? `${animal.percentageToTarget}%` : '—'}</span>
                    <span className={`trend trend-${animal.trend}`}>{trendIconMap[animal.trend] || '■'}</span>
                    <span>{renderStatusPill(animal.status)}</span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* Conteúdo do tab de Desempenho (Engorda) */}
        {activeTab === 'performance' && performanceReport && (
          <>
            {/* Botões de exportação */}
            <div className="export-buttons">
              <button className="export-btn export-pdf" onClick={exportPerformanceToPDF}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                Exportar PDF
              </button>
              <button className="export-btn export-excel" onClick={exportPerformanceToExcel}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                Exportar Excel
              </button>
            </div>

            {/* Cards de resumo do desempenho */}
            <section className="report-summary performance-summary">
              {renderSummaryCard('Total de animais', performanceReport.summary?.total, 'Animais com dados de peso registrados.')}
              {renderSummaryCard('Excelente', performanceReport.summary?.excellent, 'GMD ≥ 1.4 kg/dia')}
              {renderSummaryCard('Bom', performanceReport.summary?.good, 'GMD entre 1.0 e 1.4 kg/dia')}
              {renderSummaryCard('Regular', performanceReport.summary?.regular, 'GMD entre 0.6 e 1.0 kg/dia')}
              {renderSummaryCard('Crítico', performanceReport.summary?.critical, 'GMD < 0.6 kg/dia - Atenção!')}
              {renderSummaryCard('GMD Médio', performanceReport.summary?.average_gmd ? `${performanceReport.summary.average_gmd} kg/dia` : '—', 'Ganho Médio Diário do rebanho.')}
            </section>

            {/* Tabela de desempenho */}
            <section className="performance-table-section">
              <div className="section-header">
                <h2>Relatório de Desempenho (Engorda)</h2>
                <span>{performanceReport.animals?.length || 0} registro(s)</span>
              </div>
              <div className="performance-table-container">
                <table className="performance-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Raça</th>
                      <th>Peso Ant.</th>
                      <th>Peso Atual</th>
                      <th>Ganho</th>
                      <th>GMD</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceReport.animals?.map((animal, index) => (
                      <tr key={index} className={`performance-row ${performanceStatusColorMap[animal.status] || ''}`}>
                        <td>{animal.id}</td>
                        <td>{animal.breed || 'N/A'}</td>
                        <td>{animal.previous_weight != null ? `${animal.previous_weight} kg` : '—'}</td>
                        <td>{animal.current_weight != null ? `${animal.current_weight} kg` : '—'}</td>
                        <td className="weight-gain">{animal.weight_gain != null ? `+${animal.weight_gain} kg` : '—'}</td>
                        <td className="gmd-value">{animal.gmd != null ? animal.gmd.toFixed(3) : '—'}</td>
                        <td>
                          <span className={`performance-status-badge ${performanceStatusColorMap[animal.status] || ''}`}>
                            {animal.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default ReportCattle;
