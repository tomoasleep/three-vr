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
/**
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author erich666 / http://erichaines.com
 */
/*global THREE, console */

// This set of controls performs orbiting, dollying (zooming), and panning. It maintains
// the "up" direction as +Y, unlike the TrackballControls. Touch on tablet and phones is
// supported.
//
//    Orbit - left mouse / touch: one finger move
//    Zoom - middle mouse, or mousewheel / touch: two finger spread or squish
//    Pan - right mouse, or arrow keys / touch: three finter swipe
//
// This is a drop-in replacement for (most) TrackballControls used in examples.
// That is, include this js file and wherever you see:
//      controls = new THREE.TrackballControls( camera );
//      controls.target.z = 150;
// Simple substitute "OrbitControls" and the control should work as-is.

var OrbitControls = function(object, domElement) {

  this.object = object;
  this.domElement = (domElement !== undefined) ? domElement : document;

  // API

  // Set to false to disable this control
  this.enabled = true;

  // "target" sets the location of focus, where the control orbits around
  // and where it pans with respect to.
  this.target = new THREE.Vector3();

  // center is old, deprecated; use "target" instead
  this.center = this.target;

  // This option actually enables dollying in and out; left as "zoom" for
  // backwards compatibility
  this.noZoom = false;
  this.zoomSpeed = 1.0;

  // Limits to how far you can dolly in and out
  this.minDistance = 0;
  this.maxDistance = Infinity;

  // Set to true to disable this control
  this.noRotate = false;
  this.rotateSpeed = 1.0;

  // Set to true to disable this control
  this.noPan = false;
  this.keyPanSpeed = 7.0; // pixels moved per arrow key push

  // Set to true to automatically rotate around the target
  this.autoRotate = false;
  this.autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60

  // How far you can orbit vertically, upper and lower limits.
  // Range is 0 to Math.PI radians.
  this.minPolarAngle = 0; // radians
  this.maxPolarAngle = Math.PI; // radians

  // Set to true to disable use of the keys
  this.noKeys = false;

  // The four arrow keys
  this.keys = {
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    BOTTOM: 40
  };

  ////////////
  // internals

  var scope = this;

  var EPS = 0.000001;

  var rotateStart = new THREE.Vector2();
  var rotateEnd = new THREE.Vector2();
  var rotateDelta = new THREE.Vector2();

  var panStart = new THREE.Vector2();
  var panEnd = new THREE.Vector2();
  var panDelta = new THREE.Vector2();
  var panOffset = new THREE.Vector3();

  var offset = new THREE.Vector3();

  var dollyStart = new THREE.Vector2();
  var dollyEnd = new THREE.Vector2();
  var dollyDelta = new THREE.Vector2();

  var phiDelta = 0;
  var thetaDelta = 0;
  var scale = 1;
  var pan = new THREE.Vector3();

  var lastPosition = new THREE.Vector3();

  var STATE = {
    NONE: -1,
    ROTATE: 0,
    DOLLY: 1,
    PAN: 2,
    TOUCH_ROTATE: 3,
    TOUCH_DOLLY: 4,
    TOUCH_PAN: 5
  };

  var state = STATE.NONE;

  // for reset

  this.target0 = this.target.clone();
  this.position0 = this.object.position.clone();

  // so camera.up is the orbit axis

  var quat = new THREE.Quaternion().setFromUnitVectors(object.up, new THREE.Vector3(0, 1, 0));
  var quatInverse = quat.clone().inverse();

  // events

  var changeEvent = {
    type: 'change'
  };
  var startEvent = {
    type: 'start'
  };
  var endEvent = {
    type: 'end'
  };

  this.rotateLeft = function(angle) {

    if (angle === undefined) {

      angle = getAutoRotationAngle();

    }

    thetaDelta -= angle;

  };

  this.rotateUp = function(angle) {

    if (angle === undefined) {

      angle = getAutoRotationAngle();

    }

    phiDelta -= angle;

  };

  // pass in distance in world space to move left
  this.panLeft = function(distance) {

    var te = this.object.matrix.elements;

    // get X column of matrix
    panOffset.set(te[0], te[1], te[2]);
    panOffset.multiplyScalar(-distance);

    pan.add(panOffset);

  };

  // pass in distance in world space to move up
  this.panUp = function(distance) {

    var te = this.object.matrix.elements;

    // get Y column of matrix
    panOffset.set(te[4], te[5], te[6]);
    panOffset.multiplyScalar(distance);

    pan.add(panOffset);

  };

  // pass in x,y of change desired in pixel space,
  // right and down are positive
  this.pan = function(deltaX, deltaY) {

    var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

    if (scope.object.fov !== undefined) {

      // perspective
      var position = scope.object.position;
      var offset = position.clone().sub(scope.target);
      var targetDistance = offset.length();

      // half of the fov is center to top of screen
      targetDistance *= Math.tan((scope.object.fov / 2) * Math.PI / 180.0);

      // we actually don't use screenWidth, since perspective camera is fixed to screen height
      scope.panLeft(2 * deltaX * targetDistance / element.clientHeight);
      scope.panUp(2 * deltaY * targetDistance / element.clientHeight);

    } else if (scope.object.top !== undefined) {

      // orthographic
      scope.panLeft(deltaX * (scope.object.right - scope.object.left) / element.clientWidth);
      scope.panUp(deltaY * (scope.object.top - scope.object.bottom) / element.clientHeight);

    } else {

      // camera neither orthographic or perspective
      console.warn('WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.');

    }

  };

  this.dollyIn = function(dollyScale) {

    if (dollyScale === undefined) {

      dollyScale = getZoomScale();

    }

    scale /= dollyScale;

  };

  this.dollyOut = function(dollyScale) {

    if (dollyScale === undefined) {

      dollyScale = getZoomScale();

    }

    scale *= dollyScale;

  };

  this.update = function() {

    var position = this.object.position;

    offset.copy(position).sub(this.target);

    // rotate offset to "y-axis-is-up" space
    offset.applyQuaternion(quat);

    // angle from z-axis around y-axis

    var theta = Math.atan2(offset.x, offset.z);

    // angle from y-axis

    var phi = Math.atan2(Math.sqrt(offset.x * offset.x + offset.z * offset.z), offset.y);

    if (this.autoRotate) {

      this.rotateLeft(getAutoRotationAngle());

    }

    theta += thetaDelta;
    phi += phiDelta;

    // restrict phi to be between desired limits
    phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, phi));

    // restrict phi to be betwee EPS and PI-EPS
    phi = Math.max(EPS, Math.min(Math.PI - EPS, phi));

    var radius = offset.length() * scale;

    // restrict radius to be between desired limits
    radius = Math.max(this.minDistance, Math.min(this.maxDistance, radius));

    // move target to panned location
    this.target.add(pan);

    offset.x = radius * Math.sin(phi) * Math.sin(theta);
    offset.y = radius * Math.cos(phi);
    offset.z = radius * Math.sin(phi) * Math.cos(theta);

    // rotate offset back to "camera-up-vector-is-up" space
    offset.applyQuaternion(quatInverse);

    position.copy(this.target).add(offset);

    this.object.lookAt(this.target);

    thetaDelta = 0;
    phiDelta = 0;
    scale = 1;
    pan.set(0, 0, 0);

    if (lastPosition.distanceToSquared(this.object.position) > EPS) {

      this.dispatchEvent(changeEvent);

      lastPosition.copy(this.object.position);

    }

  };


  this.reset = function() {

    state = STATE.NONE;

    this.target.copy(this.target0);
    this.object.position.copy(this.position0);

    this.update();

  };

  function getAutoRotationAngle() {

    return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;

  }

  function getZoomScale() {

    return Math.pow(0.95, scope.zoomSpeed);

  }

  function onMouseDown(event) {

    if (scope.enabled === false) return;
    event.preventDefault();

    if (event.button === 0) {
      if (scope.noRotate === true) return;

      state = STATE.ROTATE;

      rotateStart.set(event.clientX, event.clientY);

    } else if (event.button === 1) {
      if (scope.noZoom === true) return;

      state = STATE.DOLLY;

      dollyStart.set(event.clientX, event.clientY);

    } else if (event.button === 2) {
      if (scope.noPan === true) return;

      state = STATE.PAN;

      panStart.set(event.clientX, event.clientY);

    }

    scope.domElement.addEventListener('mousemove', onMouseMove, false);
    scope.domElement.addEventListener('mouseup', onMouseUp, false);
    scope.dispatchEvent(startEvent);

  }

  function onMouseMove(event) {

    if (scope.enabled === false) return;

    event.preventDefault();

    var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

    if (state === STATE.ROTATE) {

      if (scope.noRotate === true) return;

      rotateEnd.set(event.clientX, event.clientY);
      rotateDelta.subVectors(rotateEnd, rotateStart);

      // rotating across whole screen goes 360 degrees around
      scope.rotateLeft(2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed);

      // rotating up and down along whole screen attempts to go 360, but limited to 180
      scope.rotateUp(2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed);

      rotateStart.copy(rotateEnd);

    } else if (state === STATE.DOLLY) {

      if (scope.noZoom === true) return;

      dollyEnd.set(event.clientX, event.clientY);
      dollyDelta.subVectors(dollyEnd, dollyStart);

      if (dollyDelta.y > 0) {

        scope.dollyIn();

      } else {

        scope.dollyOut();

      }

      dollyStart.copy(dollyEnd);

    } else if (state === STATE.PAN) {

      if (scope.noPan === true) return;

      panEnd.set(event.clientX, event.clientY);
      panDelta.subVectors(panEnd, panStart);

      scope.pan(panDelta.x, panDelta.y);

      panStart.copy(panEnd);

    }

    scope.update();

  }

  function onMouseUp( /* event */ ) {

    if (scope.enabled === false) return;

    scope.domElement.removeEventListener('mousemove', onMouseMove, false);
    scope.domElement.removeEventListener('mouseup', onMouseUp, false);
    scope.dispatchEvent(endEvent);
    state = STATE.NONE;

  }

  function onMouseWheel(event) {

    if (scope.enabled === false || scope.noZoom === true) return;

    event.preventDefault();
    event.stopPropagation();

    var delta = 0;

    if (event.wheelDelta !== undefined) { // WebKit / Opera / Explorer 9

      delta = event.wheelDelta;

    } else if (event.detail !== undefined) { // Firefox

      delta = -event.detail;

    }

    if (delta > 0) {

      scope.dollyOut();

    } else {

      scope.dollyIn();

    }

    scope.update();
    scope.dispatchEvent(startEvent);
    scope.dispatchEvent(endEvent);

  }

  function onKeyDown(event) {

    if (scope.enabled === false || scope.noKeys === true || scope.noPan === true) return;

    switch (event.keyCode) {

      case scope.keys.UP:
        scope.pan(0, scope.keyPanSpeed);
        scope.update();
        break;

      case scope.keys.BOTTOM:
        scope.pan(0, -scope.keyPanSpeed);
        scope.update();
        break;

      case scope.keys.LEFT:
        scope.pan(scope.keyPanSpeed, 0);
        scope.update();
        break;

      case scope.keys.RIGHT:
        scope.pan(-scope.keyPanSpeed, 0);
        scope.update();
        break;

    }

  }

  function touchstart(event) {

    if (scope.enabled === false) return;

    switch (event.touches.length) {

      case 1: // one-fingered touch: rotate

        if (scope.noRotate === true) return;

        state = STATE.TOUCH_ROTATE;

        rotateStart.set(event.touches[0].pageX, event.touches[0].pageY);
        break;

      case 2: // two-fingered touch: dolly

        if (scope.noZoom === true) return;

        state = STATE.TOUCH_DOLLY;

        var dx = event.touches[0].pageX - event.touches[1].pageX;
        var dy = event.touches[0].pageY - event.touches[1].pageY;
        var distance = Math.sqrt(dx * dx + dy * dy);
        dollyStart.set(0, distance);
        break;

      case 3: // three-fingered touch: pan

        if (scope.noPan === true) return;

        state = STATE.TOUCH_PAN;

        panStart.set(event.touches[0].pageX, event.touches[0].pageY);
        break;

      default:

        state = STATE.NONE;

    }

    scope.dispatchEvent(startEvent);

  }

  function touchmove(event) {

    if (scope.enabled === false) return;

    event.preventDefault();
    event.stopPropagation();

    var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

    switch (event.touches.length) {

      case 1: // one-fingered touch: rotate

        if (scope.noRotate === true) return;
        if (state !== STATE.TOUCH_ROTATE) return;

        rotateEnd.set(event.touches[0].pageX, event.touches[0].pageY);
        rotateDelta.subVectors(rotateEnd, rotateStart);

        // rotating across whole screen goes 360 degrees around
        scope.rotateLeft(2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed);
        // rotating up and down along whole screen attempts to go 360, but limited to 180
        scope.rotateUp(2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed);

        rotateStart.copy(rotateEnd);

        scope.update();
        break;

      case 2: // two-fingered touch: dolly

        if (scope.noZoom === true) return;
        if (state !== STATE.TOUCH_DOLLY) return;

        var dx = event.touches[0].pageX - event.touches[1].pageX;
        var dy = event.touches[0].pageY - event.touches[1].pageY;
        var distance = Math.sqrt(dx * dx + dy * dy);

        dollyEnd.set(0, distance);
        dollyDelta.subVectors(dollyEnd, dollyStart);

        if (dollyDelta.y > 0) {

          scope.dollyOut();

        } else {

          scope.dollyIn();

        }

        dollyStart.copy(dollyEnd);

        scope.update();
        break;

      case 3: // three-fingered touch: pan

        if (scope.noPan === true) return;
        if (state !== STATE.TOUCH_PAN) return;

        panEnd.set(event.touches[0].pageX, event.touches[0].pageY);
        panDelta.subVectors(panEnd, panStart);

        scope.pan(panDelta.x, panDelta.y);

        panStart.copy(panEnd);

        scope.update();
        break;

      default:

        state = STATE.NONE;

    }

  }

  function touchend( /* event */ ) {

    if (scope.enabled === false) return;

    scope.dispatchEvent(endEvent);
    state = STATE.NONE;

  }

  this.domElement.addEventListener('contextmenu', function(event) {
    event.preventDefault();
  }, false);
  this.domElement.addEventListener('mousedown', onMouseDown, false);
  this.domElement.addEventListener('mousewheel', onMouseWheel, false);
  this.domElement.addEventListener('DOMMouseScroll', onMouseWheel, false); // firefox

  this.domElement.addEventListener('touchstart', touchstart, false);
  this.domElement.addEventListener('touchend', touchend, false);
  this.domElement.addEventListener('touchmove', touchmove, false);

  window.addEventListener('keydown', onKeyDown, false);

  // force an update at start
  this.update();

};

OrbitControls.prototype = Object.create(THREE.EventDispatcher.prototype);

module.exports = OrbitControls;

},{}],6:[function(require,module,exports){
var DeviceOrientationControls = require('./controls/DeviceOrientationControls');
var OrbitControls = require('./controls/OrbitControls');
var EffectComposer = require('./EffectComposer');
var StereoPass = require('./StereoPass');
var ShaderPass = require('./ShaderPass');
var BarrelDistortsionShader = require('./shaders/BarrelDistortionShader');

var DeviceOrientationControls, orbitControls, composer;

var threevr = {

  init: function(options) {

    options = options || {};
    this._setDefault(options, 'enableBarrelDistortion', true);
    this._setDefault(options, 'enableDeviceOrientationControls', true);
    this._setDefault(options, 'enableOrbitControls', false);

    if (options.enableDeviceOrientationControls) {
      deviceOrientationControls = new DeviceOrientationControls(options.camera, true);
      deviceOrientationControls.connect();
      deviceOrientationControls.update();
    }

    if (options.enableOrbitControls) {
      orbitControls = new OrbitControls(options.camera, options.renderer.domElement);
      orbitControls.rotateUp(Math.PI / 4);
      orbitControls.target.set(
        camera.position.x + 0.1,
        camera.position.y,
        camera.position.z
      );
      orbitControls.noZoom = true;
      orbitControls.noPan = true;
    }

    composer = new EffectComposer(options.renderer);
    composer.addPass(new StereoPass(options.scene, options.camera));

    if (options.enableBarrelDistortion) {
      composer.addPass(new ShaderPass(BarrelDistortsionShader));
    }

  },

  animate: function() {
    if (deviceOrientationControls) deviceOrientationControls.update();
    if (orbitControls) orbitControls.update();
    composer.render();
  },

  _setDefault: function(obj, key, val) {
    obj[key] = obj[key] ? obj[key] : val;
  }

};

module.exports = threevr;

},{"./EffectComposer":1,"./ShaderPass":2,"./StereoPass":3,"./controls/DeviceOrientationControls":4,"./controls/OrbitControls":5,"./shaders/BarrelDistortionShader":7}],7:[function(require,module,exports){
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

},{}]},{},[6])(6)
});