export function applyBlogScrollTopTop() {
  const scrollBtn = document.getElementById("to-top-btn") as HTMLButtonElement;
  const targetHeader = document.getElementById("blog-hero") as HTMLDivElement;

  function callback(entries: IntersectionObserverEntry[]) {
    for (const entry of entries) {
      scrollBtn.dataset.show = (!entry.isIntersecting).toString();
    }
  }

  scrollBtn.addEventListener("click", () => {
    document.documentElement.scrollTo({ top: 0, behavior: "smooth" });
  });

  const observer = new IntersectionObserver(callback);
  observer.observe(targetHeader);
}
