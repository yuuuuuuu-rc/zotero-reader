import * as pdfjsLib from '/pdfjs/build/pdf.mjs';
import { EventBus, PDFFindController, PDFLinkService, PDFViewer } from '/pdfjs/web/pdf_viewer.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/build/pdf.worker.mjs';

class LocalPdfReader {
  constructor(container, viewer) {
    this.container = container;
    this.eventBus = new EventBus();
    this.linkService = new PDFLinkService({ eventBus: this.eventBus });
    this.findController = new PDFFindController({ eventBus: this.eventBus, linkService: this.linkService });
    this.viewer = new PDFViewer({ container, viewer, eventBus: this.eventBus, linkService: this.linkService, findController: this.findController, textLayerMode: 1, annotationMode: 1, imageResourcesPath: '/pdfjs/web/images/' });
    this.linkService.setViewer(this.viewer);
    this.eventBus.on('pagesinit', () => { this.viewer.currentScaleValue = 'page-width'; });
    this.eventBus.on('pagechanging', event => window.dispatchEvent(new CustomEvent('local-pdf-page', { detail: { page: event.pageNumber } })));
    this.eventBus.on('updatefindmatchescount', event => window.dispatchEvent(new CustomEvent('local-pdf-find', { detail: event.matchesCount })));
  }
  async open(url) {
    await this.loadingTask?.destroy().catch(() => {});
    this.viewer.setDocument(null); this.linkService.setDocument(null); this.findController.setDocument(null);
    this.loadingTask = pdfjsLib.getDocument({ url, cMapUrl: '/pdfjs/cmaps/', cMapPacked: true, standardFontDataUrl: '/pdfjs/standard_fonts/', wasmUrl: '/pdfjs/wasm/', enableXfa: true });
    const document = await this.loadingTask.promise;
    const pagesReady = new Promise(resolve => this.eventBus.on('pagesinit',resolve,{once:true}));
    this.viewer.setDocument(document); this.linkService.setDocument(document); this.findController.setDocument(document);
    await pagesReady;
    return document.numPages;
  }
  get page() { return this.viewer.currentPageNumber || 1; }
  set page(value) { this.viewer.currentPageNumber = Math.max(1,Math.min(this.viewer.pagesCount || 1,Number(value) || 1)); }
  zoom(factor) { this.viewer.currentScale = Math.max(.25,Math.min(5,(this.viewer.currentScale || 1) * factor)); }
  fit() { this.viewer.currentScaleValue = 'page-width'; }
  find(query) {
    this.eventBus.dispatch('find', { source: this, type: 'again', query, phraseSearch: true, caseSensitive: false, entireWord: false, highlightAll: true, findPrevious: false, matchDiacritics: false });
  }
}

window.createLocalPdfReader = (container, viewer) => new LocalPdfReader(container, viewer);
window.dispatchEvent(new Event('local-pdf-reader-ready'));
