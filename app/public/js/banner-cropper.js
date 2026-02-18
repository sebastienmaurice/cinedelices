/**
 * banner-cropper.js — Recadrage d'image côté frontend (canvas HTML5)
 *
 * POURQUOI LE CROP CÔTÉ FRONTEND ?
 * ─────────────────────────────────
 * L'utilisateur choisit visuellement la zone à conserver.
 * Le canvas HTML5 génère une image aux dimensions exactes (1408×350).
 * Seule cette image recadrée est envoyée au serveur → économie de bande passante.
 *
 * RATIO FIXE : 1408 / 350 ≈ 4.02:1
 * L'utilisateur peut zoomer (molette / slider) et déplacer (glisser) l'image
 * dans ce cadre fixe. Le cadre ne bouge jamais, c'est l'image qui se déplace.
 *
 * FONCTIONNEMENT :
 * 1. loadImage(file)  → charge un fichier dans le cropper
 * 2. L'utilisateur zoom / déplace
 * 3. export()          → génère un Blob JPEG 1408×350 prêt à envoyer
 */

class BannerCropper {
  // Dimensions finales de la bannière (en pixels)
  static OUTPUT_WIDTH = 1408;
  static OUTPUT_HEIGHT = 350;
  static RATIO = 1408 / 350; // ≈ 4.02

  /**
   * @param {HTMLCanvasElement} canvasEl — le canvas visible dans la modale
   */
  constructor(canvasEl) {
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext("2d");
    this.img = null;

    // Position de l'image par rapport au cadre (espace de sortie 1408×350)
    // offsetX/Y négatifs = l'image dépasse à gauche/haut
    this.offsetX = 0;
    this.offsetY = 0;

    // Facteur de zoom appliqué à l'image
    this.scale = 1;
    this.minScale = 1; // calculé dynamiquement pour couvrir le cadre
    this.maxScale = 5;

    // État du glissement (drag)
    this.isDragging = false;
    this.lastX = 0;
    this.lastY = 0;

    // Rapport entre taille d'affichage du canvas et taille réelle 1408×350
    // Permet de convertir les pixels écran en pixels de sortie
    this.displayRatio = 1;

    this._bindEvents();
  }

  /**
   * Charge un fichier image dans le cropper et initialise la vue
   * @param {File} file — fichier image sélectionné par l'utilisateur
   * @returns {Promise<void>}
   */
  loadImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();

        img.onload = () => {
          this.img = img;
          this._initTransform();
          this._draw();
          resolve();
        };

        img.onerror = reject;
        img.src = e.target.result;
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Initialise la position et le zoom pour que l'image couvre le cadre
   * et soit centrée. Appelé après chaque chargement d'image.
   */
  _initTransform() {
    // Ratio d'affichage : taille CSS du canvas / taille réelle de sortie
    this.displayRatio = this.canvas.clientWidth / BannerCropper.OUTPUT_WIDTH;

    // Adapter la résolution du canvas à sa taille CSS (évite le flou)
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = Math.round(this.canvas.clientWidth / BannerCropper.RATIO);

    // Scale minimum : l'image DOIT couvrir tout le cadre 1408×350
    // On prend le max entre scaleX et scaleY pour éviter les bandes noires
    const scaleX = BannerCropper.OUTPUT_WIDTH / this.img.naturalWidth;
    const scaleY = BannerCropper.OUTPUT_HEIGHT / this.img.naturalHeight;
    this.minScale = Math.max(scaleX, scaleY);

    // Max zoom = 4× le minimum (suffisant pour la plupart des images)
    this.maxScale = this.minScale * 4;

    // Commencer au zoom minimum (l'image remplit tout le cadre)
    this.scale = this.minScale;

    // Centrer l'image dans le cadre
    this.offsetX = (BannerCropper.OUTPUT_WIDTH - this.img.naturalWidth * this.scale) / 2;
    this.offsetY = (BannerCropper.OUTPUT_HEIGHT - this.img.naturalHeight * this.scale) / 2;
  }

  /**
   * Empêche l'image de sortir du cadre (pas de zone vide visible)
   * L'image doit toujours couvrir intégralement le rectangle 1408×350
   */
  _clampOffset() {
    const imgW = this.img.naturalWidth * this.scale;
    const imgH = this.img.naturalHeight * this.scale;

    // offsetX doit être ≤ 0 (image pas décalée à droite)
    // et ≥ OUTPUT_WIDTH - imgW (image pas décalée trop à gauche)
    this.offsetX = Math.min(0, Math.max(BannerCropper.OUTPUT_WIDTH - imgW, this.offsetX));
    this.offsetY = Math.min(0, Math.max(BannerCropper.OUTPUT_HEIGHT - imgH, this.offsetY));
  }

  /**
   * Redessine le canvas avec la position/zoom actuels
   * Les coordonnées sont converties de l'espace sortie → espace affichage
   */
  _draw() {
    if (!this.img) return;

    const ctx = this.ctx;
    const dr = this.displayRatio;

    // Fond sombre (visible si l'image n'est pas assez grande — ne devrait pas arriver)
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = "rgba(13, 27, 42, 0.95)";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Dessin de l'image : coordonnées de sortie × displayRatio = coordonnées écran
    ctx.drawImage(
      this.img,
      this.offsetX * dr,
      this.offsetY * dr,
      this.img.naturalWidth * this.scale * dr,
      this.img.naturalHeight * this.scale * dr
    );
  }

  /**
   * Zoom via molette de souris (delta positif = zoom in, négatif = zoom out)
   * Le zoom se fait vers le centre du cadre.
   */
  zoom(delta) {
    if (!this.img) return;

    const oldScale = this.scale;
    this.scale = Math.max(this.minScale, Math.min(this.maxScale, this.scale + delta));

    // Zoomer vers le centre du cadre pour une expérience intuitive
    const centerX = BannerCropper.OUTPUT_WIDTH / 2;
    const centerY = BannerCropper.OUTPUT_HEIGHT / 2;

    // Ajuster l'offset pour que le centre reste fixe
    this.offsetX = centerX - (centerX - this.offsetX) * (this.scale / oldScale);
    this.offsetY = centerY - (centerY - this.offsetY) * (this.scale / oldScale);

    this._clampOffset();
    this._draw();
  }

  /**
   * Définir le zoom via le slider (valeur entre 0 et 1)
   * 0 = zoom minimum (image couvre juste le cadre)
   * 1 = zoom maximum (4× le minimum)
   *
   * @param {number} value — entre 0 et 1
   */
  setZoom(value) {
    if (!this.img) return;

    const oldScale = this.scale;
    this.scale = this.minScale + (this.maxScale - this.minScale) * value;

    // Zoomer vers le centre du cadre
    const centerX = BannerCropper.OUTPUT_WIDTH / 2;
    const centerY = BannerCropper.OUTPUT_HEIGHT / 2;

    this.offsetX = centerX - (centerX - this.offsetX) * (this.scale / oldScale);
    this.offsetY = centerY - (centerY - this.offsetY) * (this.scale / oldScale);

    this._clampOffset();
    this._draw();
  }

  /**
   * Retourne le pourcentage de zoom actuel (0 = min, 1 = max)
   */
  getZoomPercent() {
    if (!this.img || this.maxScale === this.minScale) return 0;
    return (this.scale - this.minScale) / (this.maxScale - this.minScale);
  }

  /**
   * Attache les événements souris, tactile et molette au canvas
   * - Souris : clic + glisser pour déplacer, molette pour zoomer
   * - Tactile : toucher + glisser pour déplacer
   */
  _bindEvents() {
    // --- Souris : glisser pour déplacer ---
    this.canvas.addEventListener("mousedown", (e) => {
      this._startDrag(e.clientX, e.clientY);
    });

    this._onMouseMove = (e) => this._onDrag(e.clientX, e.clientY);
    this._onMouseUp = () => this._endDrag();
    window.addEventListener("mousemove", this._onMouseMove);
    window.addEventListener("mouseup", this._onMouseUp);

    // --- Tactile : glisser pour déplacer ---
    this.canvas.addEventListener("touchstart", (e) => {
      e.preventDefault();
      const t = e.touches[0];
      this._startDrag(t.clientX, t.clientY);
    }, { passive: false });

    this._onTouchMove = (e) => {
      if (this.isDragging) {
        const t = e.touches[0];
        this._onDrag(t.clientX, t.clientY);
      }
    };
    this._onTouchEnd = () => this._endDrag();
    window.addEventListener("touchmove", this._onTouchMove);
    window.addEventListener("touchend", this._onTouchEnd);

    // --- Molette : zoomer ---
    this.canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      // deltaY > 0 = scroll bas = zoom out, deltaY < 0 = scroll haut = zoom in
      const zoomStep = (this.maxScale - this.minScale) * 0.05;
      const delta = e.deltaY > 0 ? -zoomStep : zoomStep;
      this.zoom(delta);
    }, { passive: false });
  }

  /** Début du glissement — curseur main fermée */
  _startDrag(clientX, clientY) {
    if (!this.img) return;
    this.isDragging = true;
    this.lastX = clientX;
    this.lastY = clientY;
    this.canvas.classList.add("is-dragging");
  }

  /** Pendant le glissement : déplacer l'image */
  _onDrag(clientX, clientY) {
    if (!this.isDragging || !this.img) return;

    // Différence en pixels écran
    const dx = clientX - this.lastX;
    const dy = clientY - this.lastY;
    this.lastX = clientX;
    this.lastY = clientY;

    // Convertir en espace de sortie (diviser par displayRatio)
    this.offsetX += dx / this.displayRatio;
    this.offsetY += dy / this.displayRatio;

    this._clampOffset();
    this._draw();
  }

  /** Fin du glissement — curseur main ouverte */
  _endDrag() {
    this.isDragging = false;
    this.canvas.classList.remove("is-dragging");
  }

  /**
   * GÉNÉRATION FINALE : exporte l'image recadrée en Blob JPEG (1408×350)
   *
   * Utilise un canvas hors-écran (offscreen) à la résolution exacte 1408×350.
   * L'image est dessinée avec le même offset/scale que l'aperçu visible,
   * mais cette fois dans l'espace de sortie réel (pas d'affichage réduit).
   *
   * @returns {Promise<Blob|null>} — Blob JPEG prêt à envoyer via FormData
   */
  async export() {
    if (!this.img) return null;

    // Canvas hors-écran aux dimensions exactes de la bannière
    const offscreen = document.createElement("canvas");
    offscreen.width = BannerCropper.OUTPUT_WIDTH;
    offscreen.height = BannerCropper.OUTPUT_HEIGHT;
    const ctx = offscreen.getContext("2d");

    // Dessiner l'image avec le même positionnement que l'aperçu
    // mais dans l'espace de sortie (1:1, sans displayRatio)
    ctx.drawImage(
      this.img,
      this.offsetX,
      this.offsetY,
      this.img.naturalWidth * this.scale,
      this.img.naturalHeight * this.scale
    );

    // Convertir en Blob JPEG (qualité 92% — bon compromis taille/qualité)
    return new Promise((resolve) => {
      offscreen.toBlob(resolve, "image/jpeg", 0.92);
    });
  }

  /**
   * Réinitialise le cropper (libère l'image en mémoire)
   */
  destroy() {
    this.img = null;
  }

  /**
   * Nettoyage complet : supprime les event listeners
   * Appeler si le cropper doit être supprimé du DOM
   */
  cleanup() {
    window.removeEventListener("mousemove", this._onMouseMove);
    window.removeEventListener("mouseup", this._onMouseUp);
    window.removeEventListener("touchmove", this._onTouchMove);
    window.removeEventListener("touchend", this._onTouchEnd);
    this.img = null;
  }
}
