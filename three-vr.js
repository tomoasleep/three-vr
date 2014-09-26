!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),(f.THREE||(f.THREE={})).VR=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * @author alteredq / http://alteredqualia.com/
 */

var EffectComposer = function(renderer) {

  this.renderer = renderer;
  this.passes = [];

  this.reset();

};

EffectComposer.prototype = {

  swapBuffers: function() {

    var tmpL = this.readBufferL;
    this.readBufferL = this.writeBufferL;
    this.writeBufferL = tmpL;

    var tmpR = this.readBufferR;
    this.readBufferR = this.writeBufferR;
    this.writeBufferR = tmpR;

  },

  addPass: function(pass) {
    this.passes.push(pass);
  },

  popPass: function() {
    this.passes.pop();
  },

  render: function() {

    var pass, i, il = this.passes.length;

    for (i = 0; i < il; i++) {

      pass = this.passes[i];

      pass.renderToScreen = (i === il - 1);

      pass.render(this.renderer, this.writeBufferL, this.writeBufferR, this.readBufferL, this.readBufferR);

      this.swapBuffers();

    }

  },

  reset: function() {

    var width = window.innerWidth / 2;
    var height = window.innerHeight;
    var parameters = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBFormat,
      stencilBufferL: false
    };

    var renderTarget = new THREE.WebGLRenderTarget(width, height, parameters);

    this.writeBufferL = renderTarget;
    this.readBufferL = renderTarget.clone();
    this.writeBufferR = renderTarget.clone();
    this.readBufferR = renderTarget.clone();

  },

  setSize: function() {

    this.reset();

  }

};

module.exports = EffectComposer;

},{}],2:[function(require,module,exports){
/**
 * @author alteredq / http://alteredqualia.com/
 */

var ShaderPass = function(shader, textureID) {

  this.textureID = (textureID !== undefined) ? textureID : "tDiffuse";

  this.uniforms = THREE.UniformsUtils.clone(shader.uniforms);

  this.material = new THREE.ShaderMaterial({

    uniforms: this.uniforms,
    vertexShader: shader.vertexShader,
    fragmentShader: shader.fragmentShader

  });

  this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  this.scene = new THREE.Scene();

  this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), null);
  this.scene.add(this.quad);

};

ShaderPass.prototype = {

  render: function(renderer, writeBufferL, writeBufferR, readBufferL, readBufferR) {

    this.quad.material = this.material;

    var width = window.innerWidth / 2;
    var height = window.innerHeight;


    this.uniforms[this.textureID].value = readBufferL;

    renderer.setViewport(-0.1 * width, -0.1 * height, 1.16 * width, 1.2 * height);
    renderer.render(this.scene, this.camera);

    this.uniforms[this.textureID].value = readBufferR;

    renderer.setViewport(0.95 * width, -0.1 * height, 1.16 * width, 1.2 * height);
    renderer.render(this.scene, this.camera);

  }

};

module.exports = ShaderPass;

},{}],3:[function(require,module,exports){
/**
 * @author alteredq / http://alteredqualia.com/
 * @authod mrdoob / http://mrdoob.com/
 * @authod arodic / http://aleksandarrodic.com/
 */

var StereoPass = function(scene, camera) {


  this.scene = scene;
  this.camera = camera;

  this.separation = 3;

  // internals

  this._position = new THREE.Vector3();
  this._quaternion = new THREE.Quaternion();
  this._scale = new THREE.Vector3();

  this._cameraL = new THREE.PerspectiveCamera();
  this._cameraR = new THREE.PerspectiveCamera();

};

StereoPass.prototype = {

  render: function(renderer, writeBufferL, writeBufferR, readBufferL, readBufferR) {

    var width = window.innerWidth / 2;
    var height = window.innerHeight;

    this.scene.updateMatrixWorld();

    if (this.camera.parent === undefined) camera.updateMatrixWorld();

    this.camera.matrixWorld.decompose(this._position, this._quaternion, this._scale);

    // left

    this._cameraL.fov = this.camera.fov;
    this._cameraL.aspect = 0.5 * this.camera.aspect;
    this._cameraL.near = this.camera.near;
    this._cameraL.far = this.camera.far;
    this._cameraL.updateProjectionMatrix();

    this._cameraL.position.copy(this._position);
    this._cameraL.quaternion.copy(this._quaternion);
    this._cameraL.translateX(-this.separation);

    // right

    this._cameraR.near = this.camera.near;
    this._cameraR.far = this.camera.far;
    this._cameraR.projectionMatrix = this._cameraL.projectionMatrix;

    this._cameraR.position.copy(this._position);
    this._cameraR.quaternion.copy(this._quaternion);
    this._cameraR.translateX(this.separation);

    if (this.renderToScreen) {

      renderer.setViewport(0, 0, width * 2, height);
      renderer.clear();

      renderer.setViewport(width, 0, width, height);
      renderer.render(this.scene, this._cameraR);

      renderer.setViewport(0, 0, width, height);
      renderer.render(this.scene, this._cameraL);

    } else {

      renderer.setViewport(0, 0, width, height);
      renderer.render(this.scene, this._cameraL, writeBufferL, true);

      renderer.setViewport(width, 0, width, height);
      renderer.render(this.scene, this._cameraR, writeBufferR, true);

    }

  }

};

module.exports = StereoPass;

},{}],4:[function(require,module,exports){
/**
 * DeviceOrientationControls - applies device orientation on object rotation
 *
 * @param {Object} object - instance of THREE.Object3D
 * @constructor
 *
 * @author richt / http://richt.me
 * @author WestLangley / http://github.com/WestLangley
 * @author jonobr1 / http://jonobr1.com
 * @author arodic / http://aleksandarrodic.com
 * @author doug / http://github.com/doug
 *
 * W3C Device Orientation control
 * (http://w3c.github.io/deviceorientation/spec-source-orientation.html)
 */


var DeviceOrientationControls = function(object) {

  this.object = object;

  this.object.rotation.reorder('YXZ');

  this.freeze = true;

  this.movementSpeed = 1.0;
  this.rollSpeed = 0.005;
  this.autoAlign = true;
  this.autoForward = false;

  this.alpha = 0;
  this.beta = 0;
  this.gamma = 0;
  this.orient = 0;

  this.alignQuaternion = new THREE.Quaternion();
  this.orientationQuaternion = new THREE.Quaternion();

  var quaternion = new THREE.Quaternion();
  var quaternionLerp = new THREE.Quaternion();

  var tempVector3 = new THREE.Vector3();
  var tempMatrix4 = new THREE.Matrix4();
  var tempEuler = new THREE.Euler(0, 0, 0, 'YXZ');
  var tempQuaternion = new THREE.Quaternion();

  var zee = new THREE.Vector3(0, 0, 1);
  var up = new THREE.Vector3(0, 1, 0);
  var v0 = new THREE.Vector3(0, 0, 0);
  var euler = new THREE.Euler();
  var q0 = new THREE.Quaternion(); // - PI/2 around the x-axis
  var q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));

  this.deviceOrientation = {};
  this.screenOrientation = window.orientation || 0;

  this.onDeviceOrientationChangeEvent = (function(rawEvtData) {

    this.deviceOrientation = rawEvtData;

  }).bind(this);

  var getOrientation = function() {
    switch (window.screen.orientation || window.screen.mozOrientation) {
      case 'landscape-primary':
        return 90;
      case 'landscape-secondary':
        return -90;
      case 'portrait-secondary':
        return 180;
      case 'portrait-primary':
        return 0;
    }
    // this returns 90 if width is greater then height 
    // and window orientation is undefined OR 0
    // if (!window.orientation && window.innerWidth > window.innerHeight)
    //   return 90;
    return window.orientation || 0;
  };

  this.onScreenOrientationChangeEvent = (function() {

    this.screenOrientation = getOrientation();

  }).bind(this);

  this.update = function() {

    return function() {

      if (this.freeze) return;

      // should not need this
      var orientation = getOrientation();
      if (orientation !== this.screenOrientation) {
        this.screenOrientation = orientation;
        this.autoAlign = true;
      }

      this.alpha = this.deviceOrientation.gamma ?
        THREE.Math.degToRad(this.deviceOrientation.alpha) : 0; // Z
      this.beta = this.deviceOrientation.beta ?
        THREE.Math.degToRad(this.deviceOrientation.beta) : 0; // X'
      this.gamma = this.deviceOrientation.gamma ?
        THREE.Math.degToRad(this.deviceOrientation.gamma) : 0; // Y''
      this.orient = this.screenOrientation ?
        THREE.Math.degToRad(this.screenOrientation) : 0; // O

      // The angles alpha, beta and gamma
      // form a set of intrinsic Tait-Bryan angles of type Z-X'-Y''

      // 'ZXY' for the device, but 'YXZ' for us
      euler.set(this.beta, this.alpha, -this.gamma, 'YXZ');

      quaternion.setFromEuler(euler);
      quaternionLerp.slerp(quaternion, 0.5); // interpolate

      // orient the device
      if (this.autoAlign) this.orientationQuaternion.copy(quaternion); // interpolation breaks the auto alignment
      else this.orientationQuaternion.copy(quaternionLerp);

      // camera looks out the back of the device, not the top
      this.orientationQuaternion.multiply(q1);

      // adjust for screen orientation
      this.orientationQuaternion.multiply(q0.setFromAxisAngle(zee, -this.orient));

      this.object.quaternion.copy(this.alignQuaternion);
      this.object.quaternion.multiply(this.orientationQuaternion);

      if (this.autoForward) {

        tempVector3
          .set(0, 0, -1)
          .applyQuaternion(this.object.quaternion, 'ZXY')
          .setLength(this.movementSpeed / 50); // TODO: why 50 :S

        this.object.position.add(tempVector3);

      }

      if (this.autoAlign && this.alpha !== 0) {

        this.autoAlign = false;

        this.align();

      }

    };

  }();

  // //debug
  // window.addEventListener('click', (function(){
  //   this.align();
  // }).bind(this)); 

  this.align = function() {

    tempVector3
      .set(0, 0, -1)
      .applyQuaternion(tempQuaternion.copy(this.orientationQuaternion).inverse(), 'ZXY');

    tempEuler.setFromQuaternion(
      tempQuaternion.setFromRotationMatrix(
        tempMatrix4.lookAt(tempVector3, v0, up)
      )
    );

    tempEuler.set(0, tempEuler.y, 0);
    this.alignQuaternion.setFromEuler(tempEuler);

  };

  this.connect = function() {

    // run once on load
    this.onScreenOrientationChangeEvent();

    // window.addEventListener('orientationchange', this.onScreenOrientationChangeEvent, false);
    window.addEventListener('deviceorientation', this.onDeviceOrientationChangeEvent, false);

    this.freeze = false;

    return this;

  };

  this.disconnect = function() {

    this.freeze = true;

    // window.removeEventListener('orientationchange', this.onScreenOrientationChangeEvent, false);
    window.removeEventListener('deviceorientation', this.onDeviceOrientationChangeEvent, false);

  };


};

module.exports = DeviceOrientationControls;

},{}],5:[function(require,module,exports){
var DeviceOrientationControls = require('./controls/DeviceOrientationControls');
var EffectComposer = require('./EffectComposer');
var StereoPass = require('./StereoPass');
var ShaderPass = require('./ShaderPass');
var BarrelDistortsionShader = require('./shaders/BarrelDistortsionShader');

var controls, composer;

var threevr = {

  init: function(renderer, scene, camera) {

    controls = new DeviceOrientationControls(camera, true);
    controls.connect();
    controls.update();

    composer = new EffectComposer(renderer);
    composer.addPass(new StereoPass(scene, camera));
    composer.addPass(new ShaderPass(BarrelDistortsionShader));
  },

  animate: function() {
    controls.update();
    composer.render();
  },

};

module.exports = threevr;

},{"./EffectComposer":1,"./ShaderPass":2,"./StereoPass":3,"./controls/DeviceOrientationControls":4,"./shaders/BarrelDistortsionShader":6}],6:[function(require,module,exports){
/**
 * @author alteredq / http://alteredqualia.com/
 *
 * Dot screen shader
 * based on glfx.js sepia shader
 * https://github.com/evanw/glfx.js
 */

var BarrelDistortsionShader = {

  uniforms: {

    "tDiffuse": {
      type: "t",
      value: null
    },
    "coefficients": {
      type: "v3",
      value: new THREE.Vector3(1.0, 0.22, 0.24)
    },

  },

  vertexShader: [

    "varying vec2 vUv;",

    "void main() {",

    "vUv = uv;",

    "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

    "}"

  ].join("\n"),

  fragmentShader: [

    "uniform vec3 coefficients;",

    "uniform sampler2D tDiffuse;",

    "varying vec2 vUv;",

    "vec2 distort(vec2 p)",

    "{",

    "float rSq = p.y * p.y + p.x * p.x;",

    "p = p * (coefficients.x + rSq * coefficients.y + rSq * rSq * coefficients.z);",

    "return 0.5 * (p + 1.0);",

    "}",

    "void main() {",

    "vec2 xy = 2.0 * vUv - 1.0;",

    "vec2 uv = distort(xy);",

    "float d = length(uv);",

    "if (!all(equal(clamp(uv, vec2(0.0, 0.0), vec2(1.0, 1.0)), uv))) {",

    "gl_FragColor = vec4(0.0);",

    "} else {",

    "gl_FragColor = texture2D( tDiffuse, uv );",

    "}",

    "}"

  ].join("\n")

};

module.exports = BarrelDistortsionShader;

},{}]},{},[5])(5)
});