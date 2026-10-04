document.querySelectorAll(".site-nav").forEach((header) => {
  const toggle = header.querySelector(".site-nav__toggle");
  header.classList.add("site-nav--enhanced");
  toggle.hidden = false;
  const setOpen = (open) => {
    header.classList.toggle("site-nav--open", open);
    toggle.setAttribute("aria-expanded", String(open));
  };
  toggle.addEventListener("click", () => {
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });
  header.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      toggle.getAttribute("aria-expanded") === "true"
    ) {
      setOpen(false);
      toggle.focus();
    }
  });
});

// A group of links closes when focus leaves it, so it does not stay open over
// the page after a click elsewhere.
document.querySelectorAll(".site-nav__group").forEach((group) => {
  group.addEventListener("focusout", (event) => {
    if (!group.contains(event.relatedTarget)) group.open = false;
  });
});
