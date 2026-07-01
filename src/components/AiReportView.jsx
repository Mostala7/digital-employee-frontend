import React, { useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Download, AlertTriangle, CheckCircle, Info, DownloadCloud, AlertCircle } from "lucide-react";
import "./AiReportView.css";

const AiReportView = ({ report, onBack }) => {
  const reportRef = useRef(null);

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Report_${report.period?.from?.split("T")[0] || 'start'}_to_${report.period?.to?.split("T")[0] || 'end'}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF", err);
      alert("Failed to download PDF.");
    }
  };

  const getRiskIcon = (level) => {
    switch(level?.toLowerCase()) {
      case "critical": return <AlertTriangle color="#ef4444" size={20} />;
      case "high": return <AlertTriangle color="#f97316" size={20} />;
      case "medium": return <AlertCircle color="#eab308" size={20} />;
      case "low": return <CheckCircle color="#22c55e" size={20} />;
      default: return <Info color="#3b82f6" size={20} />;
    }
  };

  return (
    <div className="ai-report-container">
      <div className="ai-report-actions">
        <button className="btn-secondary" onClick={onBack}>← Back to Generate</button>
        <button className="btn-primary" onClick={handleDownloadPdf}>
          <DownloadCloud size={16} style={{ marginRight: 8 }} /> Download PDF
        </button>
      </div>

      <div className="ai-report-document" ref={reportRef} dir="rtl">
        <header className="report-header">
          <h1>{report.reportTitle}</h1>
          <div className="report-meta">
            <span className={`risk-badge risk-${report.riskLevel?.toLowerCase()}`}>
              {getRiskIcon(report.riskLevel)} مستوى الخطر: {report.riskLevel}
            </span>
            <span className="period-badge">
              الفترة: {new Date(report.period?.from).toLocaleDateString()} - {new Date(report.period?.to).toLocaleDateString()}
            </span>
          </div>
        </header>

        <section className="report-section">
          <h2>الملخص</h2>
          <p className="summary-text">{report.summaryAr}</p>
        </section>

        {report.highlightsAr && report.highlightsAr.length > 0 && (
          <section className="report-section">
            <h2>أهم النقاط</h2>
            <ul className="highlights-list">
              {report.highlightsAr.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </section>
        )}

        {report.problems && report.problems.length > 0 && (
          <section className="report-section">
            <h2>المشاكل المكتشفة</h2>
            <div className="problems-grid">
              {report.problems.map((p, i) => (
                <div key={i} className={`problem-card severity-${p.severity?.toLowerCase()}`}>
                  <div className="problem-header">
                    <h3>{p.title}</h3>
                    <span className="severity-badge">{p.severity}</span>
                  </div>
                  <p>{p.description}</p>
                  {p.evidence && p.evidence.length > 0 && (
                    <div className="evidence-box">
                      <strong>أدلة:</strong>
                      <ul>
                        {p.evidence.map((e, j) => <li key={j}>{e}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {report.recommendations && report.recommendations.length > 0 && (
          <section className="report-section">
            <h2>التوصيات</h2>
            <div className="recommendations-list">
              {report.recommendations.map((r, i) => (
                <div key={i} className="recommendation-item">
                  <div className="rec-header">
                    <h3>{r.title}</h3>
                    <span className={`priority-badge priority-${r.priority?.toLowerCase()}`}>{r.priority}</span>
                  </div>
                  <p>{r.description}</p>
                  <div className="rec-footer">
                    <span><strong>التأثير المتوقع:</strong> {r.expectedImpact}</span>
                    <span><strong>المسؤول المقترح:</strong> {r.suggestedOwner}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {report.suggestedActions && report.suggestedActions.length > 0 && (
          <section className="report-section">
            <h2>الإجراءات المقترحة</h2>
            <ul className="actions-list">
              {report.suggestedActions.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
};

export default AiReportView;
