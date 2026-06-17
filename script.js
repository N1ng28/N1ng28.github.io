// 선택한 파일들을 기억해 두는 배열
let selectedFiles = [];

// 화면 요소들 가져오기
const fileInput = document.getElementById("files");
const prefixInput = document.getElementById("prefix");
const suffixInput = document.getElementById("suffix");
const findInput = document.getElementById("find");
const replaceInput = document.getElementById("replace");
const numberSelect = document.getElementById("number");
const caseSelect = document.getElementById("case");
const previewBody = document.querySelector("#preview tbody");
const downloadBtn = document.getElementById("download");

// 파일 이름을 "이름 부분"과 "확장자 부분"으로 나누기
function splitName(filename) {
  const dot = filename.lastIndexOf(".");
  if (dot <= 0) {
    return { base: filename, ext: "" }; // 확장자가 없는 경우
  }
  return { base: filename.slice(0, dot), ext: filename.slice(dot) };
}

// 숫자를 01, 02 처럼 두 자리로 맞추기
function pad(num) {
  return String(num).padStart(2, "0");
}

// 규칙을 적용해서 새 이름 한 개를 만들기
function makeNewName(original, index) {
  let { base, ext } = splitName(original);

  // 찾기 / 바꾸기
  const find = findInput.value;
  if (find !== "") {
    base = base.split(find).join(replaceInput.value);
  }

  // 접두사 / 접미사
  base = prefixInput.value + base + suffixInput.value;

  // 순번 매기기
  const numberMode = numberSelect.value;
  if (numberMode === "prefix") {
    base = pad(index + 1) + "_" + base;
  } else if (numberMode === "suffix") {
    base = base + "_" + pad(index + 1);
  }

  // 대소문자 (확장자까지 함께 바꿈)
  let result = base + ext;
  if (caseSelect.value === "lower") {
    result = result.toLowerCase();
  } else if (caseSelect.value === "upper") {
    result = result.toUpperCase();
  }

  return result;
}

// 미리보기 표를 다시 그리기
function updatePreview() {
  previewBody.innerHTML = "";

  if (selectedFiles.length === 0) {
    previewBody.innerHTML =
      '<tr><td colspan="4" class="empty">아직 선택한 파일이 없습니다.</td></tr>';
    downloadBtn.disabled = true;
    return;
  }

  selectedFiles.forEach((file, i) => {
    const newName = makeNewName(file.name, i);
    const row = document.createElement("tr");
    row.innerHTML =
      "<td>" + (i + 1) + "</td>" +
      "<td>" + file.name + "</td>" +
      '<td class="arrow">→</td>' +
      "<td><strong>" + newName + "</strong></td>";
    previewBody.appendChild(row);
  });

  downloadBtn.disabled = false;
}

// 파일을 새로 고를 때
fileInput.addEventListener("change", (e) => {
  selectedFiles = Array.from(e.target.files);
  updatePreview();
});

// 규칙 입력칸이 바뀔 때마다 미리보기 갱신
[prefixInput, suffixInput, findInput, replaceInput, numberSelect, caseSelect].forEach(
  (el) => {
    el.addEventListener("input", updatePreview);
    el.addEventListener("change", updatePreview);
  }
);

// ZIP으로 내려받기
downloadBtn.addEventListener("click", async () => {
  if (selectedFiles.length === 0) return;

  downloadBtn.disabled = true;
  downloadBtn.textContent = "⏳ 압축 중...";

  const zip = new JSZip();
  const usedNames = {}; // 이름이 겹치지 않도록 관리

  for (let i = 0; i < selectedFiles.length; i++) {
    const file = selectedFiles[i];
    let newName = makeNewName(file.name, i);

    // 같은 이름이 생기면 뒤에 (1), (2) 붙이기
    if (usedNames[newName]) {
      const { base, ext } = splitName(newName);
      newName = base + "(" + usedNames[newName] + ")" + ext;
      usedNames[newName] = 1;
    } else {
      usedNames[newName] = 1;
    }

    const content = await file.arrayBuffer();
    zip.file(newName, content);
  }

  const blob = await zip.generateAsync({ type: "blob" });

  // 내려받기 링크를 만들어 자동 클릭
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "renamed_files.zip";
  a.click();
  URL.revokeObjectURL(url);

  downloadBtn.textContent = "📦 바뀐 파일 ZIP으로 내려받기";
  downloadBtn.disabled = false;
});
