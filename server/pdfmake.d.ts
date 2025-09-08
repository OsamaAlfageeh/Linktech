
declare module 'pdfmake/src/printer.js' {
  export default class PdfPrinter {
    constructor(fonts: any);
    createPdfKitDocument(docDefinition: any): any;
  }
}
