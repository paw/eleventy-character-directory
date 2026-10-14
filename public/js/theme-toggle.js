function setTheme(theme,save = "skip") {
  document.body.dataset.theme = theme;
  if (save === "save") {
    // save into cookie when changing away from auto...
    document.cookie = `theme=${theme}; path=/; max-age=31536000; SameSite=Lax`;
    document.body.dataset.themeMode = "cookie";
  } else if (save === "reset") {
    // ...delete cookie when changing back to auto
    document.cookie = "theme=; path=/; max-age=0; SameSite=Lax";
    document.body.dataset.themeMode = "auto";
  } else {
    // ...otherwise we don't do anything with cookies
    document.body.dataset.themeMode = "auto";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // try to load saved theme
  const darkThemeMq = window.matchMedia("(prefers-color-scheme: dark)");
  const savedTheme = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("theme="))
    ?.split("=")[1];

  // set saved theme or use sys preference
  if (savedTheme === "light" || savedTheme === "dark") {
    document.body.dataset.theme = savedTheme;
    document.body.dataset.themeMode = "cookie";
  } else {
    setTheme(darkThemeMq.matches ? "dark" : "light");
    document.body.dataset.themeMode = "auto";
  }

  // changes only when no theme is saved to a cookie
  darkThemeMq.addEventListener("change", (e) => {
    const hasSavedTheme = document.cookie
      .split("; ")
      .some((cookie) => cookie.startsWith("theme="));

    if (!hasSavedTheme) {
      document.body.dataset.theme = e.matches ? "dark" : "light";
    }
  });

  document.getElementById("theme-toggle").addEventListener("click", (event) => {
    // try to load saved theme from cookie
    const savedTheme = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith("theme="))
      ?.split("=")[1];

    // cycle through 3 options: auto -> light -> dark
    if (savedTheme === "light") {
      setTheme("dark","save")
    } else if (savedTheme === "dark") {
      const darkThemeMq = window.matchMedia("(prefers-color-scheme: dark)");
      setTheme(darkThemeMq.matches ? "dark" : "light","reset");
    } else {
      setTheme("light","save")
    }
  });

});
