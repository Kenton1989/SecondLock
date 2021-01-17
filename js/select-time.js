
function selectTime(btn) {
    
}

timeBtnDiv = document.getElementById("buttons");
const defaultTimes = [1, 5, 10, 15, 30, 60];

defaultTimes.forEach(minutes => {
    newBtn = document.createElement("button");
    newBtn.innerText = minutes + " min";
    newBtn.value = minutes;
    newBtn.classList.add("time-select");
    newBtn.onclick = selectTime;
    timeBtnDiv.appendChild(newBtn);
});