import pptxgen from 'pptxgenjs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface FurnitureItem {
  id: string;
  name: string;
  category: string;
  description?: string;
  imageUrl?: string;
  price: number;
  quantity?: number;
}

export interface ProjectData {
  projectName: string;
  projectId: string;
  layoutImageUrl?: string | null;
  roomPhotoUrl?: string | null;
  styleRefUrls?: string[];
  renderUrls: string[];
  currentRenderUrl?: string | null;
  furnitureItems: FurnitureItem[];
}

export interface InvoiceDetails {
  clientName: string;
  clientAddress?: string;
  clientPhone?: string;
  clientEmail?: string;
  invoiceNumber: string;
  invoiceDate: string;
  notes?: string;
}

// Format currency in INR with Indian number formatting
export const formatINR = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

// Calculate totals with 20% commission
export const calculateTotals = (items: FurnitureItem[]) => {
  const subtotal = items.reduce((sum, item) => {
    const qty = item.quantity ?? 1;
    return sum + (item.price || 0) * qty;
  }, 0);
  const commissionRate = 0.20; // 20%
  const commission = subtotal * commissionRate;
  const grandTotal = subtotal + commission;
  
  return {
    subtotal,
    commission,
    commissionRate: commissionRate * 100,
    grandTotal,
  };
};

// Generate invoice number
export const generateInvoiceNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `PI-${year}${month}-${random}`;
};

// Convert image URL to base64
const imageUrlToBase64 = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to convert image to base64:', error);
    return null;
  }
};

// Generate PowerPoint Presentation
export const generatePPT = async (data: ProjectData): Promise<void> => {
  const pptx = new pptxgen();
  
  // Set presentation properties
  pptx.author = 'Interior Design Studio';
  pptx.title = data.projectName;
  pptx.subject = 'Interior Design Presentation';
  pptx.company = 'Interior Design Studio';
  
  // Define colors
  const primaryColor = '7C3AED'; // Purple
  const accentColor = 'F59E0B'; // Amber
  const darkBg = '1A1A2E';
  const lightText = 'FFFFFF';
  const mutedText = 'A0A0A0';
  
  // ============ SLIDE 1: Title Slide ============
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: darkBg };
  
  // Title
  titleSlide.addText(data.projectName, {
    x: 0.5,
    y: 2.5,
    w: 9,
    h: 1,
    fontSize: 44,
    fontFace: 'Arial',
    color: lightText,
    bold: true,
    align: 'center',
  });
  
  // Subtitle
  titleSlide.addText('Interior Design Presentation', {
    x: 0.5,
    y: 3.6,
    w: 9,
    h: 0.5,
    fontSize: 18,
    fontFace: 'Arial',
    color: mutedText,
    align: 'center',
  });
  
  // Date
  titleSlide.addText(new Date().toLocaleDateString('en-IN', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  }), {
    x: 0.5,
    y: 4.3,
    w: 9,
    h: 0.5,
    fontSize: 14,
    fontFace: 'Arial',
    color: accentColor,
    align: 'center',
  });
  
  // ============ SLIDE 2: 2D Layout (if available) ============
  if (data.layoutImageUrl) {
    const layoutSlide = pptx.addSlide();
    layoutSlide.background = { color: darkBg };
    
    layoutSlide.addText('2D Floor Plan', {
      x: 0.5,
      y: 0.3,
      w: 9,
      h: 0.6,
      fontSize: 28,
      fontFace: 'Arial',
      color: primaryColor,
      bold: true,
    });
    
    const layoutBase64 = await imageUrlToBase64(data.layoutImageUrl);
    if (layoutBase64) {
      layoutSlide.addImage({
        data: layoutBase64,
        x: 0.75,
        y: 1,
        w: 8.5,
        h: 4.5,
        sizing: { type: 'contain', w: 8.5, h: 4.5 },
      });
    }
  }
  
  // ============ SLIDE 3: Style References (if available) ============
  if (data.styleRefUrls && data.styleRefUrls.length > 0) {
    const styleSlide = pptx.addSlide();
    styleSlide.background = { color: darkBg };
    
    styleSlide.addText('Style References', {
      x: 0.5,
      y: 0.3,
      w: 9,
      h: 0.6,
      fontSize: 28,
      fontFace: 'Arial',
      color: primaryColor,
      bold: true,
    });
    
    // Grid layout for style refs (max 4)
    const styleRefs = data.styleRefUrls.slice(0, 4);
    const cols = styleRefs.length > 2 ? 2 : styleRefs.length;
    const rows = Math.ceil(styleRefs.length / cols);
    const imgWidth = 4;
    const imgHeight = 2.5;
    
    for (let i = 0; i < styleRefs.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = 0.5 + col * 4.5;
      const y = 1.2 + row * 2.8;
      
      const base64 = await imageUrlToBase64(styleRefs[i]);
      if (base64) {
        styleSlide.addImage({
          data: base64,
          x,
          y,
          w: imgWidth,
          h: imgHeight,
          sizing: { type: 'cover', w: imgWidth, h: imgHeight },
        });
      }
    }
  }
  
  // ============ SLIDE 4+: Generated Renders ============
  for (let i = 0; i < data.renderUrls.length; i++) {
    const renderSlide = pptx.addSlide();
    renderSlide.background = { color: darkBg };
    
    renderSlide.addText(`Generated Render ${i + 1}`, {
      x: 0.5,
      y: 0.3,
      w: 9,
      h: 0.6,
      fontSize: 28,
      fontFace: 'Arial',
      color: primaryColor,
      bold: true,
    });
    
    const renderBase64 = await imageUrlToBase64(data.renderUrls[i]);
    if (renderBase64) {
      renderSlide.addImage({
        data: renderBase64,
        x: 0.5,
        y: 1,
        w: 9,
        h: 4.5,
        sizing: { type: 'contain', w: 9, h: 4.5 },
      });
    }
  }
  
  // ============ SLIDE: Furniture Catalog ============
  if (data.furnitureItems.length > 0) {
    const catalogSlide = pptx.addSlide();
    catalogSlide.background = { color: darkBg };
    
    catalogSlide.addText('Selected Furniture', {
      x: 0.5,
      y: 0.3,
      w: 9,
      h: 0.6,
      fontSize: 28,
      fontFace: 'Arial',
      color: primaryColor,
      bold: true,
    });
    
    // Grid of furniture items (max 6 per slide)
    const itemsPerSlide = 6;
    const displayItems = data.furnitureItems.slice(0, itemsPerSlide);
    const cols = 3;
    const itemWidth = 2.8;
    const itemHeight = 2;
    
    for (let i = 0; i < displayItems.length; i++) {
      const item = displayItems[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = 0.5 + col * 3.1;
      const y = 1.1 + row * 2.5;
      
      // Item image
      if (item.imageUrl) {
        const base64 = await imageUrlToBase64(item.imageUrl);
        if (base64) {
          catalogSlide.addImage({
            data: base64,
            x,
            y,
            w: itemWidth,
            h: itemHeight - 0.5,
            sizing: { type: 'cover', w: itemWidth, h: itemHeight - 0.5 },
          });
        }
      }
      
      // Item name
      catalogSlide.addText(item.name, {
        x,
        y: y + itemHeight - 0.4,
        w: itemWidth,
        h: 0.3,
        fontSize: 10,
        fontFace: 'Arial',
        color: lightText,
        bold: true,
      });
      
      // Item price
      catalogSlide.addText(formatINR(item.price), {
        x,
        y: y + itemHeight - 0.1,
        w: itemWidth,
        h: 0.25,
        fontSize: 9,
        fontFace: 'Arial',
        color: accentColor,
      });
    }
  }
  
  // ============ SLIDE: Pricing Summary ============
  if (data.furnitureItems.length > 0) {
    const pricingSlide = pptx.addSlide();
    pricingSlide.background = { color: darkBg };
    
    pricingSlide.addText('Pricing Summary', {
      x: 0.5,
      y: 0.3,
      w: 9,
      h: 0.6,
      fontSize: 28,
      fontFace: 'Arial',
      color: primaryColor,
      bold: true,
    });
    
    const totals = calculateTotals(data.furnitureItems);
    
    // Table data
    const tableRows: pptxgen.TableRow[] = [
      // Header
      [
        { text: '#', options: { bold: true, color: lightText, fill: { color: '2D2D44' } } },
        { text: 'Item', options: { bold: true, color: lightText, fill: { color: '2D2D44' } } },
        { text: 'Category', options: { bold: true, color: lightText, fill: { color: '2D2D44' } } },
        { text: 'Qty', options: { bold: true, color: lightText, fill: { color: '2D2D44' }, align: 'center' } },
        { text: 'Unit Price', options: { bold: true, color: lightText, fill: { color: '2D2D44' }, align: 'right' } },
        { text: 'Total', options: { bold: true, color: lightText, fill: { color: '2D2D44' }, align: 'right' } },
      ],
    ];
    
    // Items
    data.furnitureItems.forEach((item, idx) => {
      const qty = item.quantity ?? 1;
      const lineTotal = (item.price || 0) * qty;
      tableRows.push([
        { text: (idx + 1).toString(), options: { color: mutedText } },
        { text: item.name, options: { color: lightText } },
        { text: item.category, options: { color: mutedText } },
        { text: qty.toString(), options: { color: lightText, align: 'center' } },
        { text: formatINR(item.price), options: { color: mutedText, align: 'right' } },
        { text: formatINR(lineTotal), options: { color: lightText, align: 'right' } },
      ]);
    });
    
    pricingSlide.addTable(tableRows, {
      x: 0.5,
      y: 1,
      w: 9,
      colW: [0.4, 3, 1.5, 0.6, 1.5, 2],
      fontSize: 10,
      fontFace: 'Arial',
      border: { type: 'solid', pt: 0.5, color: '3D3D5C' },
    });
    
    // Totals section
    const totalsY = 1.2 + (tableRows.length * 0.4);
    
    pricingSlide.addText(`Subtotal: ${formatINR(totals.subtotal)}`, {
      x: 5.5,
      y: Math.min(totalsY, 4.2),
      w: 4,
      h: 0.4,
      fontSize: 14,
      fontFace: 'Arial',
      color: lightText,
      align: 'right',
    });
    
    pricingSlide.addText(`Commission (${totals.commissionRate}%): ${formatINR(totals.commission)}`, {
      x: 5.5,
      y: Math.min(totalsY + 0.4, 4.6),
      w: 4,
      h: 0.4,
      fontSize: 14,
      fontFace: 'Arial',
      color: mutedText,
      align: 'right',
    });
    
    pricingSlide.addText(`Grand Total: ${formatINR(totals.grandTotal)}`, {
      x: 5.5,
      y: Math.min(totalsY + 0.9, 5.1),
      w: 4,
      h: 0.5,
      fontSize: 18,
      fontFace: 'Arial',
      color: accentColor,
      bold: true,
      align: 'right',
    });
  }
  
  // ============ SLIDE: Thank You ============
  const thankYouSlide = pptx.addSlide();
  thankYouSlide.background = { color: darkBg };
  
  thankYouSlide.addText('Thank You', {
    x: 0.5,
    y: 2.2,
    w: 9,
    h: 1,
    fontSize: 48,
    fontFace: 'Arial',
    color: lightText,
    bold: true,
    align: 'center',
  });
  
  thankYouSlide.addText('We look forward to working with you', {
    x: 0.5,
    y: 3.3,
    w: 9,
    h: 0.5,
    fontSize: 16,
    fontFace: 'Arial',
    color: mutedText,
    align: 'center',
  });
  
  // Save the presentation
  await pptx.writeFile({ fileName: `${data.projectName.replace(/[^a-zA-Z0-9]/g, '_')}_Presentation.pptx` });
};

// Generate Proforma Invoice PDF
export const generateProformaInvoice = async (
  data: ProjectData,
  invoiceDetails: InvoiceDetails
): Promise<void> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Colors
  const primaryColor: [number, number, number] = [124, 58, 237]; // Purple
  const accentColor: [number, number, number] = [245, 158, 11]; // Amber
  const darkText: [number, number, number] = [30, 30, 46];
  const mutedText: [number, number, number] = [120, 120, 140];
  
  let yPos = 20;
  
  // ============ HEADER ============
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('PROFORMA INVOICE', 15, 25);
  
  // Invoice details (right side)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #: ${invoiceDetails.invoiceNumber}`, pageWidth - 15, 18, { align: 'right' });
  doc.text(`Date: ${invoiceDetails.invoiceDate}`, pageWidth - 15, 25, { align: 'right' });
  doc.text(`Project: ${data.projectName}`, pageWidth - 15, 32, { align: 'right' });
  
  yPos = 55;
  
  // ============ CLIENT DETAILS ============
  doc.setTextColor(...darkText);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 15, yPos);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  yPos += 7;
  doc.text(invoiceDetails.clientName, 15, yPos);
  
  if (invoiceDetails.clientAddress) {
    yPos += 5;
    doc.setTextColor(...mutedText);
    doc.setFontSize(10);
    doc.text(invoiceDetails.clientAddress, 15, yPos);
  }
  
  if (invoiceDetails.clientPhone) {
    yPos += 5;
    doc.text(`Phone: ${invoiceDetails.clientPhone}`, 15, yPos);
  }
  
  if (invoiceDetails.clientEmail) {
    yPos += 5;
    doc.text(`Email: ${invoiceDetails.clientEmail}`, 15, yPos);
  }
  
  yPos += 15;
  
  // ============ IMAGES SECTION ============
  const imageWidth = 85;
  const imageHeight = 50;
  
  // 2D Layout
  if (data.layoutImageUrl) {
    try {
      const layoutBase64 = await imageUrlToBase64(data.layoutImageUrl);
      if (layoutBase64) {
        doc.setTextColor(...darkText);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('2D Layout:', 15, yPos);
        yPos += 3;
        doc.addImage(layoutBase64, 'PNG', 15, yPos, imageWidth, imageHeight);
      }
    } catch (e) {
      console.error('Failed to add layout image:', e);
    }
  }
  
  // Final Render
  if (data.currentRenderUrl) {
    try {
      const renderBase64 = await imageUrlToBase64(data.currentRenderUrl);
      if (renderBase64) {
        doc.setTextColor(...darkText);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Final Render:', 105, yPos - 3);
        doc.addImage(renderBase64, 'PNG', 105, yPos, imageWidth, imageHeight);
      }
    } catch (e) {
      console.error('Failed to add render image:', e);
    }
  }
  
  yPos += imageHeight + 15;
  
  // ============ FURNITURE TABLE ============
  doc.setTextColor(...darkText);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Furniture Items', 15, yPos);
  yPos += 5;
  
  const tableData = data.furnitureItems.map((item, idx) => {
    const qty = item.quantity ?? 1;
    const lineTotal = (item.price || 0) * qty;
    return [
      (idx + 1).toString(),
      item.name,
      item.category,
      qty.toString(),
      formatINR(item.price),
      formatINR(lineTotal),
    ];
  });
  
  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Item Name', 'Category', 'Qty', 'Unit Price', 'Total (INR)']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: darkText,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 50 },
      2: { cellWidth: 30 },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 35, halign: 'right' },
      5: { cellWidth: 35, halign: 'right' },
    },
    margin: { left: 15, right: 15 },
  });
  
  // Get the final Y position after the table
  const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || yPos + 50;
  yPos = finalY + 15;
  
  // ============ TOTALS SECTION ============
  const totals = calculateTotals(data.furnitureItems);
  
  // Totals box
  const boxX = pageWidth - 85;
  const boxWidth = 70;
  
  doc.setDrawColor(...mutedText);
  doc.setLineWidth(0.5);
  doc.rect(boxX, yPos - 5, boxWidth, 40);
  
  // Subtotal
  doc.setTextColor(...darkText);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', boxX + 5, yPos + 3);
  doc.text(formatINR(totals.subtotal), boxX + boxWidth - 5, yPos + 3, { align: 'right' });
  
  // Commission
  doc.setTextColor(...mutedText);
  doc.text(`Commission (${totals.commissionRate}%):`, boxX + 5, yPos + 12);
  doc.text(formatINR(totals.commission), boxX + boxWidth - 5, yPos + 12, { align: 'right' });
  
  // Divider
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(1);
  doc.line(boxX + 5, yPos + 18, boxX + boxWidth - 5, yPos + 18);
  
  // Grand Total
  doc.setTextColor(...accentColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('GRAND TOTAL:', boxX + 5, yPos + 28);
  doc.text(formatINR(totals.grandTotal), boxX + boxWidth - 5, yPos + 28, { align: 'right' });
  
  yPos += 55;
  
  // ============ NOTES ============
  if (invoiceDetails.notes) {
    doc.setTextColor(...darkText);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 15, yPos);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedText);
    doc.setFontSize(9);
    
    const splitNotes = doc.splitTextToSize(invoiceDetails.notes, pageWidth - 30);
    doc.text(splitNotes, 15, yPos + 6);
  }
  
  // ============ FOOTER ============
  const footerY = doc.internal.pageSize.getHeight() - 15;
  
  doc.setDrawColor(...mutedText);
  doc.setLineWidth(0.3);
  doc.line(15, footerY - 5, pageWidth - 15, footerY - 5);
  
  doc.setTextColor(...mutedText);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('This is a proforma invoice and not a tax invoice.', pageWidth / 2, footerY, { align: 'center' });
  doc.text('All prices are in Indian Rupees (INR).', pageWidth / 2, footerY + 4, { align: 'center' });
  
  // Save the PDF
  doc.save(`${data.projectName.replace(/[^a-zA-Z0-9]/g, '_')}_Invoice_${invoiceDetails.invoiceNumber}.pdf`);
};
