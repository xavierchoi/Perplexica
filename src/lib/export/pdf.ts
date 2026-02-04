import jsPDF from 'jspdf';
import { Section } from '@/lib/hooks/useChat';
import { SourceBlock, Chunk } from '@/lib/types';
import { toast } from 'sonner';

export const exportAsPDF = (sections: Section[], title: string): void => {
  // 빈 sections 배열 체크
  if (!sections || sections.length === 0) return;

  try {
    const doc = new jsPDF();
    const date = new Date(
      sections[0]?.message?.createdAt || Date.now(),
    ).toLocaleString();
    let y = 15;
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(18);
    doc.text(`Chat Export: ${title}`, 10, y);
    y += 8;
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Exported on: ${date}`, 10, y);
    y += 8;
    doc.setDrawColor(200);
    doc.line(10, y, 200, y);
    y += 6;
    doc.setTextColor(30);

    sections.forEach((section) => {
      if (y > pageHeight - 30) {
        doc.addPage();
        y = 15;
      }
      doc.setFont('helvetica', 'bold');
      doc.text('User', 10, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text(
        `${new Date(section.message.createdAt).toLocaleString()}`,
        40,
        y,
      );
      y += 6;
      doc.setTextColor(30);
      doc.setFontSize(12);
      const userLines = doc.splitTextToSize(section.message.query, 180);
      for (let i = 0; i < userLines.length; i++) {
        if (y > pageHeight - 20) {
          doc.addPage();
          y = 15;
        }
        doc.text(userLines[i], 12, y);
        y += 6;
      }
      y += 6;
      doc.setDrawColor(230);
      if (y > pageHeight - 10) {
        doc.addPage();
        y = 15;
      }
      doc.line(10, y, 200, y);
      y += 4;

      if (section.message.responseBlocks.length > 0) {
        if (y > pageHeight - 30) {
          doc.addPage();
          y = 15;
        }
        doc.setFont('helvetica', 'bold');
        doc.text('Assistant', 10, y);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(120);
        doc.text(
          `${new Date(section.message.createdAt).toLocaleString()}`,
          40,
          y,
        );
        y += 6;
        doc.setTextColor(30);
        doc.setFontSize(12);
        const assistantLines = doc.splitTextToSize(
          section.parsedTextBlocks?.join('\n') || '',
          180,
        );
        for (let i = 0; i < assistantLines.length; i++) {
          if (y > pageHeight - 20) {
            doc.addPage();
            y = 15;
          }
          doc.text(assistantLines[i], 12, y);
          y += 6;
        }

        const sourceResponseBlock = section.message.responseBlocks.find(
          (block) => block.type === 'source',
        ) as SourceBlock | undefined;

        if (
          sourceResponseBlock &&
          sourceResponseBlock.data &&
          sourceResponseBlock.data.length > 0
        ) {
          doc.setFontSize(11);
          doc.setTextColor(80);
          if (y > pageHeight - 20) {
            doc.addPage();
            y = 15;
          }
          doc.text('Citations:', 12, y);
          y += 5;
          sourceResponseBlock.data.forEach((src: Chunk, i: number) => {
            const url = src.metadata?.url || '';
            if (y > pageHeight - 15) {
              doc.addPage();
              y = 15;
            }
            doc.text(`- [${i + 1}] ${url}`, 15, y);
            y += 5;
          });
          doc.setTextColor(30);
        }
        y += 6;
        doc.setDrawColor(230);
        if (y > pageHeight - 10) {
          doc.addPage();
          y = 15;
        }
        doc.line(10, y, 200, y);
        y += 4;
      }
    });
    doc.save(`${title || 'chat'}.pdf`);
  } catch (error) {
    console.error('PDF export failed:', error);
    toast.error('PDF 내보내기에 실패했습니다. 다시 시도해주세요.');
  }
};
