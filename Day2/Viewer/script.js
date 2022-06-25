let scene, camera, renderer;
let gui;

// rhinoファイルのパス
const filePath = "../result.3dm";

// ライブラリの読み込み
import * as THREE from "three";
import { OrbitControls } from "OrbitControls";
import { Rhino3dmLoader } from "Rhino3dmLoader";
import { GUI } from "GUI";
import rhino3dm from "rhino3dm";

// rhinoローダーの初期化
const rhinoLoader = new Rhino3dmLoader();
rhinoLoader.setLibraryPath(
  "https://cdn.jsdelivr.net/npm/rhino3dm@0.15.0-beta/"
);

rhino3dm().then(async (rhino) => {
  //ビューアーの初期化
  init();
  // Rhinoファイルを読み込み
  let res = await fetch(filePath);
  let buffer = await res.arrayBuffer();

  // マテリアルを作成
  let material = new THREE.MeshBasicMaterial({
    side: THREE.DoubleSide,
    vertexColors: THREE.VertexColors,
    opacity: 0.5,
    transparent: true,
  });
  let lineMaterial = new THREE.MeshBasicMaterial({
    color: 0x4d4d4d,
    side: THREE.DoubleSide,
  });

  // rhinoオブジェクトをthree.jsに変換してsceneに追加
  rhinoLoader.parse(buffer, function (object) {
    //  レイヤー名を取得
    const layers = object.userData.layers;
    // 各オブジェクトごとの処理
    object.children.forEach((obj) => {
      // レイヤーインデックスを取得
      const layerIndex = obj.userData.attributes.layerIndex;
      //   Lineの場合は別のマテリアルを割り当て
      if (layers[layerIndex].name === "Communication_Line") {
        obj.material = lineMaterial;
      } else {
        obj.material = material;
      }
    });
    // sceneに追加
    scene.add(object);
    // GUIにレイヤーを追加
    initGUI( object.userData.layers );
  });
});

// ビューアーの初期化
function init() {
  // Zupに変換
  THREE.Object3D.DefaultUp = new THREE.Vector3(0, 0, 1);

  // sceneを作成
  scene = new THREE.Scene();
  scene.background = new THREE.Color(1, 1, 1);
  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    100000
  );
  // カメラのポジション
  camera.position.set(-10000, -10000, 1000);

  // Axesを追加
  const axes = new THREE.AxesHelper();
  scene.add(axes);

  // レンダラーを追加
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  // オービットコントロールを追加
  const controls = new OrbitControls(camera, renderer.domElement);
  animate();
}

// アニメーション
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

// GUIの設定
function initGUI(layers) {
  gui = new GUI({ title: "layers" });

  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    gui
      .add(layer, "visible")
      .name(layer.name)
      .onChange(function (val) {
        const name = this.object.name;

        scene.traverse(function (child) {
          if (child.userData.hasOwnProperty("attributes")) {
            if ("layerIndex" in child.userData.attributes) {
              const layerName =
                layers[child.userData.attributes.layerIndex].name;

              if (layerName === name) {
                child.visible = val;
                layer.visible = val;
              }
            }
          }
        });
      });
  }
}
