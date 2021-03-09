import { blinkElement } from "./utility.js";

/**
 * Setup the navigation list of the "section" elements in the current html page.
 *
 * Assumptions on the html page:
 * - There is a list item template with class "nav-item".
 * - There is a link element ("a") in the item template.
 * - There is an element with id "nav-list" as the container of all nav-item.
 * - All the "section" elements in the html page has an id.
 * - All the "section" elements contains a child of class "section-title",
 *   containing the title of the section.
 */
function setupSectionNav() {
  let sections = document.getElementsByTagName("section");
  let navList = document.getElementById("nav-list");
  let tempItem = document.getElementsByClassName("nav-item")[0];
  // console.debug(tempItem)
  // console.debug(link)

  for (const sec of sections) {
    if (sec.style.display == "none") continue;
    if (!sec.id) continue;
    let title = sec.getElementsByClassName("section-title")[0];
    let copy = tempItem.cloneNode(true);
    let link = copy.getElementsByTagName("a")[0];
    link.href = "#" + sec.id;
    link.innerText = title.innerText;
    link.onclick = function () {
      blinkElement(title, 5);
    };
    // console.debug(sec)
    navList.appendChild(copy);
  }
}

export { setupSectionNav };
