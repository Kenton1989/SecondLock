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
  // console.log(tempItem)
  let link = tempItem.getElementsByTagName("a")[0];
  // console.log(link)

  for (const sec of sections) {
    let title = sec.getElementsByClassName("section-title")[0].innerText;
    link.href = "#"+sec.id;
    link.innerText = title;
    // console.log(sec)
    let copy = tempItem.cloneNode(true);
    navList.appendChild(copy);
  }
};

export { setupSectionNav };