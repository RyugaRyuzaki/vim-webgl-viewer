/**
 * @module vim-loader/materials
 */

import * as THREE from 'three'
import { StandardMaterial } from './standardMaterial'
import { createMaskMaterial } from './maskMaterial'
import { createIsolationMaterial } from './isolationMaterial'
import { OutlineMaterial } from './outlineMaterial'
import { Settings } from '../../vim-webgl-viewer/viewerSettings'
import { MergeMaterial } from './mergeMaterial'
import { SignalDispatcher } from 'ste-signals'

/**
 * Defines the materials to be used by the vim loader and allows for material injection.
 */
export class ViewerMaterials {
  static instance: ViewerMaterials

  static createInstance (instance: ViewerMaterials) {
    this.instance = instance
  }

  static getInstance () {
    if (!this.instance) {
      this.instance = new ViewerMaterials()
    }
    return this.instance
  }

  /**
   * Material used for opaque model geometry
   */
  opaque: StandardMaterial
  /**
   * Material used for transparent model geometry
   */
  transparent: StandardMaterial
  /**
   * Material used when creating wireframe geometry of the model
   */
  wireframe: THREE.LineBasicMaterial
  /**
   * Material used to show traces of hidden objects
   */
  isolation: THREE.Material
  /**
   * Material used to filter out what is not selected for selection outline effect.
   */
  mask: THREE.ShaderMaterial
  /**
   * Material used for selection outline effect.
   */
  outline: OutlineMaterial

  /**
   * Material used to merge outline effect with scene render.
   */
  merge: MergeMaterial

  private _clippingPlanes: THREE.Plane[] | undefined
  private _sectionStrokeWitdh: number = 0.01
  private _sectionStrokeFallof: number = 0.75
  private _sectionStrokeColor: THREE.Color = new THREE.Color(0xf6, 0xf6, 0xf6)
  private _focusIntensity: number = 0.75
  private _focusColor: THREE.Color = new THREE.Color(1, 1, 1)
  private _onUpdate = new SignalDispatcher()

  constructor (
    opaque?: StandardMaterial,
    transparent?: StandardMaterial,
    wireframe?: THREE.LineBasicMaterial,
    isolation?: THREE.Material,
    mask?: THREE.ShaderMaterial,
    outline?: OutlineMaterial,
    merge?: MergeMaterial,
    grid?: THREE.ShaderMaterial
  ) {
    this.opaque = opaque ?? new StandardMaterial(createOpaque())
    this.transparent = transparent ?? new StandardMaterial(createTransparent())
    this.wireframe = wireframe ?? createWireframe()
    this.isolation = isolation ?? createIsolationMaterial()
    this.mask = mask ?? createMaskMaterial()
    this.outline = outline ?? new OutlineMaterial()
    this.merge = merge ?? new MergeMaterial()
  }

  /**
   * Updates material settings based on the provided configuration.
   * @param {Settings} settings - The settings to apply to the materials.
   */
  applySettings (settings: Settings) {
    this.isolationOpacity = settings.materials.isolation.opacity
    this.isolationColor = settings.materials.isolation.color

    this.wireframeColor = settings.materials.highlight.color
    this.wireframeOpacity = settings.materials.highlight.opacity

    this.sectionStrokeWitdh = settings.materials.section.strokeWidth
    this.sectionStrokeFallof = settings.materials.section.strokeFalloff
    this.sectionStrokeColor = settings.materials.section.strokeColor

    this.outlineIntensity = settings.materials.outline.intensity
    this.outlineFalloff = settings.materials.outline.falloff
    this.outlineBlur = settings.materials.outline.blur
    this.outlineColor = settings.materials.outline.color
  }

  /**
   * A signal dispatched whenever a material is modified.
   */
  get onUpdate () {
    return this._onUpdate.asEvent()
  }

  /**
   * Determines the opacity of the isolation material.
   */
  get isolationOpacity () {
    return this.isolation.opacity
  }

  set isolationOpacity (opacity: number) {
    const mat = this.isolation as THREE.ShaderMaterial
    mat.uniforms.opacity.value = opacity
    mat.uniformsNeedUpdate = true
    this._onUpdate.dispatch()
  }

  /**
   * Determines the color of the isolation material.
   */
  get isolationColor (): THREE.Color {
    const mat = this.isolation as THREE.ShaderMaterial
    return mat.uniforms.fillColor.value
  }

  set isolationColor (color: THREE.Color) {
    const mat = this.isolation as THREE.ShaderMaterial
    mat.uniforms.fillColor.value = color
    mat.uniformsNeedUpdate = true
    this._onUpdate.dispatch()
  }

   /**
   * Determines the color intensity of the highlight effect on mouse hover.
   */
  get focusIntensity () {
    return this._focusIntensity
  }

  set focusIntensity (value: number) {
    if (this._focusIntensity === value) return
    this._focusIntensity = value
    this.opaque.focusIntensity = value
    this.transparent.focusIntensity = value
    this._onUpdate.dispatch()
  }

  /**
   * Determines the color of the highlight effect on mouse hover.
   */
  get focusColor () {
    return this._focusColor
  }

  set focusColor (value: THREE.Color) {
    if (this._focusColor === value) return
    this._focusColor = value
    this.opaque.focusColor = value
    this.transparent.focusColor = value
    this._onUpdate.dispatch()
  }

  /**
   * Determines the color of wireframe meshes.
   */
  get wireframeColor () {
    return this.wireframe.color
  }

  set wireframeColor (value: THREE.Color) {
    if (this.wireframe.color === value) return
    this.wireframe.color = value
    this._onUpdate.dispatch()
  }

  /**
   * Determines the opacity of wireframe meshes.
   */
  get wireframeOpacity () {
    return this.wireframe.opacity
  }

  set wireframeOpacity (value: number) {
    if (this.wireframe.opacity === value) return

    this.wireframe.opacity = value
    this._onUpdate.dispatch()
  }

  /**
   * The clipping planes applied to all relevent materials
   */
  get clippingPlanes () {
    return this._clippingPlanes
  }

  set clippingPlanes (value: THREE.Plane[] | undefined) {
    // THREE Materials will break if assigned undefined
    this._clippingPlanes = value
    this.opaque.clippingPlanes = value ?? null
    this.transparent.clippingPlanes = value ?? null
    this.wireframe.clippingPlanes = value ?? null
    this.isolation.clippingPlanes = value ?? null
    this.mask.clippingPlanes = value ?? null
    this._onUpdate.dispatch()
  }

  /**
   * The width of the stroke effect where the section box intersects the model.
   */
  get sectionStrokeWitdh () {
    return this._sectionStrokeWitdh
  }

  set sectionStrokeWitdh (value: number) {
    if (this._sectionStrokeWitdh === value) return
    this._sectionStrokeWitdh = value
    this.opaque.sectionStrokeWitdh = value
    this.transparent.sectionStrokeWitdh = value
    this._onUpdate.dispatch()
  }

  /**
   * Gradient of the stroke effect where the section box intersects the model.
   */
  get sectionStrokeFallof () {
    return this._sectionStrokeFallof
  }

  set sectionStrokeFallof (value: number) {
    if (this._sectionStrokeFallof === value) return
    this._sectionStrokeFallof = value
    this.opaque.sectionStrokeFallof = value
    this.transparent.sectionStrokeFallof = value
    this._onUpdate.dispatch()
  }

  /**
   * Color of the stroke effect where the section box intersects the model.
   */
  get sectionStrokeColor () {
    return this._sectionStrokeColor
  }

  set sectionStrokeColor (value: THREE.Color) {
    if (this._sectionStrokeColor === value) return
    this._sectionStrokeColor = value
    this.opaque.sectionStrokeColor = value
    this.transparent.sectionStrokeColor = value
    this._onUpdate.dispatch()
  }

  /**
   * Color of the selection outline effect.
   */
  get outlineColor () {
    return this.merge.color
  }

  set outlineColor (value: THREE.Color) {
    if (this.merge.color === value) return
    this.merge.color = value
    this._onUpdate.dispatch()
  }

  /**
   * Size of the blur convolution on the selection outline effect.
   */
  get outlineBlur () {
    return this.outline.strokeBlur
  }

  set outlineBlur (value: number) {
    if (this.outline.strokeBlur === value) return
    this.outline.strokeBlur = value
    this._onUpdate.dispatch()
  }

  /**
   * Gradient of the the selection outline effect.
   */
  get outlineFalloff () {
    return this.outline.strokeBias
  }

  set outlineFalloff (value: number) {
    if (this.outline.strokeBias === value) return
    this.outline.strokeBias = value
    this._onUpdate.dispatch()
  }

  /**
   * Intensity of the the selection outline effect.
   */
  get outlineIntensity () {
    return this.outline.strokeMultiplier
  }

  set outlineIntensity (value: number) {
    if (this.outline.strokeMultiplier === value) return
    this.outline.strokeMultiplier = value
    this._onUpdate.dispatch()
  }

  /** dispose all materials. */
  dispose () {
    this.opaque.dispose()
    this.transparent.dispose()
    this.wireframe.dispose()
    this.isolation.dispose()
    this.mask.dispose()
    this.outline.dispose()
  }
}

/**
 * Creates a new instance of the default loader opaque material.
 * @returns {THREE.MeshPhongMaterial} A new instance of MeshPhongMaterial with transparency.
 */
export function createOpaque () {
  return new THREE.MeshPhongMaterial({
    color: 0x999999,
    vertexColors: true,
    flatShading: true,
    side: THREE.DoubleSide,
    shininess: 5
  })
}

/**
 * Creates a new instance of the default loader transparent material.
 * @returns {THREE.MeshPhongMaterial} A new instance of MeshPhongMaterial with transparency.
 */
export function createTransparent () {
  const mat = createOpaque()
  mat.transparent = true
  mat.shininess = 70
  return mat
}

/**
 * Creates a new instance of the default wireframe material.
 * @returns {THREE.LineBasicMaterial} A new instance of LineBasicMaterial.
 */
export function createWireframe () {
  const material = new THREE.LineBasicMaterial({
    depthTest: false,
    opacity: 1,
    color: new THREE.Color(0x0000ff),
    transparent: true
  })
  return material
}
