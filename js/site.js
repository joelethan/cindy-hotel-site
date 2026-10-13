(function () {
    "use strict";

    var WHATSAPP_NUMBER = "256768793015";
    var EMAIL = "coronationhotels@gmail.com";
    // Paste the Jinja Airbnb listing link here; "Book on Airbnb" buttons stay hidden until it is set.
    var AIRBNB_URL = "https://www.airbnb.com/rooms/1794353356561334282";

    document.documentElement.classList.remove("no-js");

    var root = document.documentElement;
    var header = document.querySelector(".header");
    var mobileQuery = window.matchMedia("(max-width: 960px)");
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    // Lock page scroll while an overlay (menu, photo viewer) is open
    function lockScroll(locked) { root.classList.toggle("no-scroll", locked); }

    // Mobile navigation
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.getElementById("site-nav");
    function setMenu(open) {
        if (!toggle || !nav) return;
        nav.classList.toggle("is-open", open);
        toggle.setAttribute("aria-expanded", String(open));
        toggle.innerHTML = open ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
        lockScroll(open);
    }
    if (toggle && nav) {
        toggle.addEventListener("click", function () { setMenu(!nav.classList.contains("is-open")); });
        nav.querySelectorAll("a").forEach(function (link) {
            link.addEventListener("click", function () { setMenu(false); });
        });
        mobileQuery.addEventListener("change", function (e) { if (!e.matches) setMenu(false); });
    }

    // Header: shadow once scrolled; on phones it tucks away while scrolling down
    // and comes back when scrolling up, to leave more room for content.
    var lastY = window.scrollY;
    var autoScrolling = false;
    var autoTimer = null;
    var backToTop = null;

    function setHeaderHidden(hidden) {
        root.classList.toggle("header-hidden", hidden && mobileQuery.matches);
    }

    function endAutoScroll() {
        autoScrolling = false;
        lastY = window.scrollY;
    }

    function startAutoScroll() {
        autoScrolling = true;
        clearTimeout(autoTimer);
        autoTimer = setTimeout(endAutoScroll, 150);
    }

    function onScroll() {
        var y = window.scrollY;
        if (header) header.classList.toggle("is-scrolled", y > 8);
        if (autoScrolling) {
            clearTimeout(autoTimer);
            autoTimer = setTimeout(endAutoScroll, 150);
        } else if (!root.classList.contains("no-scroll")) {
            if (y < 160) setHeaderHidden(false);
            else if (y > lastY + 6) setHeaderHidden(true);
            else if (y < lastY - 6) setHeaderHidden(false);
        }
        lastY = y;
        if (backToTop) backToTop.classList.toggle("is-visible", y > 800);
    }

    // Smooth in-page scrolling that lands sections just below the sticky bars
    function stickyOffset(goingDown) {
        var offset = 16;
        var headerWillHide = mobileQuery.matches && goingDown;
        if (header && !headerWillHide) offset += header.offsetHeight;
        var bar = document.querySelector(".subnav");
        if (bar) offset += bar.offsetHeight;
        return offset;
    }

    // page position from layout, ignoring the temporary fade-in offset on .reveal items
    function pageTop(el) {
        var y = 0;
        for (; el; el = el.offsetParent) y += el.offsetTop;
        return y;
    }

    function scrollToTarget(target) {
        var top = pageTop(target);
        var goingDown = top > window.scrollY + 1;
        var y = Math.max(0, top - stickyOffset(goingDown));
        setHeaderHidden(goingDown && y >= 160);
        startAutoScroll();
        window.scrollTo({ top: y, behavior: reduceMotion.matches ? "auto" : "smooth" });
        // move keyboard focus to the section without jumping the page
        if (!target.hasAttribute("tabindex") && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) {
            target.setAttribute("tabindex", "-1");
        }
        target.focus({ preventScroll: true });
    }

    function pageName(path) {
        var name = path.split("/").pop();
        return name === "" ? "index.html" : name.replace(/\.html$/, "") + ".html";
    }

    // Links like "index.html#rooms" on the home page scroll instead of reloading
    function inPageTarget(link) {
        if (!link.hash || link.target === "_blank") return null;
        if (link.origin !== window.location.origin) return null;
        if (pageName(link.pathname) !== pageName(window.location.pathname)) return null;
        try { return document.querySelector(decodeURIComponent(link.hash)); } catch (e) { return null; }
    }

    document.addEventListener("click", function (event) {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        var link = event.target.closest("a[href*='#']");
        if (!link || link.hasAttribute("data-lightbox")) return;
        var target = inPageTarget(link);
        if (!target) return;
        event.preventDefault();
        scrollToTarget(target);
        if (window.location.hash !== link.hash) history.pushState(null, "", link.hash);
    });

    // Back-to-top button
    backToTop = document.createElement("button");
    backToTop.type = "button";
    backToTop.className = "back-to-top";
    backToTop.setAttribute("aria-label", "Back to top");
    backToTop.innerHTML = '<i class="fa-solid fa-arrow-up"></i>';
    backToTop.addEventListener("click", function () {
        setHeaderHidden(false);
        startAutoScroll();
        window.scrollTo({ top: 0, behavior: reduceMotion.matches ? "auto" : "smooth" });
    });
    document.body.appendChild(backToTop);

    window.addEventListener("scroll", onScroll, { passive: true });
    mobileQuery.addEventListener("change", function () { setHeaderHidden(false); });
    onScroll();

    // Main navigation follows the section in view (home page: Rooms, Gallery)
    if (nav) {
        var navLinks = Array.prototype.slice.call(nav.querySelectorAll(".nav__link"));
        var pageLink = nav.querySelector(".nav__link.is-active");
        var spy = navLinks.map(function (link) {
            return { link: link, section: inPageTarget(link) };
        }).filter(function (item) { return item.section; });

        if (spy.length && pageLink) {
            var updateNav = function () {
                var line = (header ? header.getBoundingClientRect().bottom : 0) + window.innerHeight * 0.3;
                var current = pageLink;
                spy.forEach(function (item) {
                    var r = item.section.getBoundingClientRect();
                    if (r.top <= line && r.bottom > line) current = item.link;
                });
                navLinks.forEach(function (link) { link.classList.toggle("is-active", link === current); });
            };
            window.addEventListener("scroll", function () { window.requestAnimationFrame(updateNav); }, { passive: true });
            updateNav();
        }
    }

    // Reveal on scroll
    var reveals = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    io.unobserve(entry.target);
                }
            });
        }, { rootMargin: "0px 0px -60px 0px" });
        reveals.forEach(function (el) { io.observe(el); });
    } else {
        reveals.forEach(function (el) { el.classList.add("is-visible"); });
    }

    // Section sub-navigation: highlight the section in view
    var subnav = document.querySelector(".subnav");
    if (subnav) {
        var subList = subnav.querySelector(".subnav__list");
        var subLinks = Array.prototype.slice.call(subnav.querySelectorAll(".subnav__link"));
        var sections = subLinks.map(function (link) {
            return document.querySelector(link.getAttribute("href"));
        }).filter(Boolean);

        var setActive = function (id) {
            subLinks.forEach(function (link) {
                var active = link.getAttribute("href") === "#" + id;
                link.classList.toggle("is-active", active);
                if (active) {
                    link.setAttribute("aria-current", "true");
                    // keep the active pill visible when the list scrolls sideways (mobile)
                    var left = link.offsetLeft - (subList.clientWidth - link.offsetWidth) / 2;
                    subList.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
                } else {
                    link.removeAttribute("aria-current");
                }
            });
        };

        var updateActive = function () {
            var offset = subnav.getBoundingClientRect().bottom + window.innerHeight * 0.35;
            var current = null;
            sections.forEach(function (section) {
                if (section.getBoundingClientRect().top <= offset) current = section.id;
            });
            // at the very bottom of the page, the last section is the active one
            if (window.scrollY > 0 && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
                current = sections[sections.length - 1].id;
            }
            if (current !== subnav.getAttribute("data-current")) {
                subnav.setAttribute("data-current", current || "");
                setActive(current);
            }
        };

        subLinks.forEach(function (link) {
            link.addEventListener("click", function () {
                var id = link.getAttribute("href").slice(1);
                subnav.setAttribute("data-current", id);
                setActive(id);
            });
        });

        var ticking = false;
        window.addEventListener("scroll", function () {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(function () { updateActive(); ticking = false; });
        }, { passive: true });
        window.addEventListener("resize", updateActive);
        updateActive();
    }

    // Date fields: no past dates, check-out after check-in
    var today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    var todayStr = today.toISOString().slice(0, 10);
    document.querySelectorAll('input[type="date"]').forEach(function (input) {
        input.min = todayStr;
    });
    document.querySelectorAll("[data-checkin]").forEach(function (checkin) {
        var form = checkin.form;
        var checkout = form && form.querySelector("[data-checkout]");
        if (!checkout) return;
        checkin.addEventListener("change", function () {
            if (!checkin.value) return;
            var next = new Date(checkin.value);
            next.setDate(next.getDate() + 1);
            var nextStr = next.toISOString().slice(0, 10);
            checkout.min = nextStr;
            if (!checkout.value || checkout.value < nextStr) checkout.value = nextStr;
        });
    });

    // "Request this room" buttons pre-select the room in the booking form
    document.querySelectorAll("[data-room]").forEach(function (btn) {
        btn.addEventListener("click", function () {
            var select = document.getElementById("booking-room");
            if (select) select.value = btn.getAttribute("data-room");
        });
    });

    // Pre-fill enquiry type from ?topic= on the contact page
    var params = new URLSearchParams(window.location.search);
    var topic = params.get("topic");
    var topicSelect = document.getElementById("enquiry-type");
    if (topic && topicSelect) {
        Array.prototype.forEach.call(topicSelect.options, function (opt) {
            if (opt.value.toLowerCase() === topic.toLowerCase()) topicSelect.value = opt.value;
        });
    }

    // Show only the fields that apply to the chosen enquiry type
    if (topicSelect) {
        var conditional = Array.prototype.slice.call(document.querySelectorAll("[data-show-when]"));
        var updateFields = function () {
            var type = topicSelect.value;
            conditional.forEach(function (field) {
                field.hidden = field.getAttribute("data-show-when").split("|").indexOf(type) === -1;
            });
        };
        topicSelect.addEventListener("change", updateFields);
        updateFields();
    }

    // Forms send a pre-written message via WhatsApp or email
    function formatDate(value) {
        if (!value) return "";
        var d = new Date(value + "T00:00:00");
        return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
    }

    function buildMessage(form) {
        var lines = [form.getAttribute("data-intro") || "Hello Coronation Hotel Hoima,"];
        lines.push("");
        form.querySelectorAll("[data-label]").forEach(function (field) {
            if (field.closest("[hidden]")) return;
            var value = field.value.trim();
            if (!value) return;
            if (field.type === "date") value = formatDate(value);
            lines.push(field.getAttribute("data-label") + ": " + value);
        });
        lines.push("");
        lines.push("Thank you.");
        return lines.join("\n");
    }

    function showStatus(form, type, html) {
        var status = form.querySelector(".form-status");
        if (!status) return;
        status.className = "form-status form-status--" + type;
        status.innerHTML = html;
        status.hidden = false;
        status.scrollIntoView({ block: "nearest", behavior: reduceMotion.matches ? "auto" : "smooth" });
    }

    // "Send by email" posts the enquiry to FormSubmit, which forwards it to the hotel inbox
    function sendEmail(form, button) {
        var emailField = form.querySelector('input[type="email"]');
        var phoneField = form.querySelector('input[type="tel"]');
        if (emailField && !emailField.value.trim() && !(phoneField && phoneField.value.trim())) {
            emailField.setCustomValidity("Please add your email or phone number so we can reply.");
            emailField.reportValidity();
            emailField.addEventListener("input", function clear() {
                emailField.setCustomValidity("");
                emailField.removeEventListener("input", clear);
            });
            return;
        }

        var nameField = form.querySelector('[autocomplete="name"]');
        var name = nameField ? nameField.value.trim() : "";
        var honey = form.querySelector('[name="_honey"]');
        if (honey && honey.value) {
            form.reset();
            showStatus(form, "success", '<i class="fa-solid fa-circle-check"></i><span>Thank you! Your message has been sent.</span>');
            return;
        }

        var payload = {};
        form.querySelectorAll("[data-label]").forEach(function (field) {
            if (field.closest("[hidden]")) return;
            var value = field.value.trim();
            if (!value) return;
            if (field.type === "date") value = formatDate(value);
            payload[field.getAttribute("data-label")] = value;
        });
        var topicField = form.querySelector("#enquiry-type");
        payload._subject = (form.getAttribute("data-subject") || "Website enquiry") +
            (topicField ? " – " + topicField.value : "") + (name ? " – " + name : "");
        payload._template = "table";
        payload._captcha = "false";
        if (emailField && emailField.value.trim()) payload._replyto = emailField.value.trim();

        var original = button.innerHTML;
        button.disabled = true;
        button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending…';
        var status = form.querySelector(".form-status");
        if (status) status.hidden = true;

        var controller = "AbortController" in window ? new AbortController() : null;
        var timer = controller ? setTimeout(function () { controller.abort(); }, 20000) : null;

        fetch(form.getAttribute("data-email-endpoint"), {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify(payload),
            signal: controller ? controller.signal : undefined
        })
            .then(function (res) { return res.json().catch(function () { return {}; }); })
            .then(function (data) {
                if (String(data.success) !== "true") throw new Error(data.message || "Send failed");
                form.reset();
                if (topicField) topicField.dispatchEvent(new Event("change"));
                showStatus(form, "success", '<i class="fa-solid fa-circle-check"></i><span>Thank you' +
                    (name ? ", " + name.replace(/[<>&"]/g, "") : "") +
                    "! Your message has been sent. We will get back to you soon.</span>");
            })
            .catch(function (err) {
                if (window.console) console.warn("Email enquiry failed:", err && err.message);
                showStatus(form, "error", '<i class="fa-solid fa-circle-exclamation"></i><span>Sorry, your message could not be sent right now. ' +
                    'Please use <strong>Send on WhatsApp</strong>, or email us directly at <a href="mailto:' + EMAIL + '">' + EMAIL + "</a>.</span>");
            })
            .then(function () {
                if (timer) clearTimeout(timer);
                button.disabled = false;
                button.innerHTML = original;
            });
    }

    document.querySelectorAll("form[data-enquiry]").forEach(function (form) {
        form.addEventListener("submit", function (event) {
            event.preventDefault();
            if (!form.reportValidity()) return;
            var via = (event.submitter && event.submitter.value) || "whatsapp";
            if (via === "email" && form.hasAttribute("data-email-endpoint")) {
                sendEmail(form, event.submitter);
                return;
            }
            var message = buildMessage(form);
            if (via === "email") {
                var subject = form.getAttribute("data-subject") || "Enquiry from website";
                window.location.href = "mailto:" + EMAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(message);
            } else {
                window.open("https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message), "_blank", "noopener");
            }
        });
    });

    // Gallery lightbox
    var lightbox = document.querySelector(".lightbox");
    if (lightbox) {
        var lbImg = lightbox.querySelector("img");
        var lbClose = lightbox.querySelector("button");
        var lastFocus = null;
        function close() {
            lightbox.classList.remove("is-open");
            lbImg.removeAttribute("src");
            lockScroll(false);
            if (lastFocus) lastFocus.focus();
        }
        document.querySelectorAll("[data-lightbox]").forEach(function (link) {
            link.addEventListener("click", function (event) {
                event.preventDefault();
                lastFocus = link;
                var img = link.querySelector("img");
                lbImg.src = link.getAttribute("href");
                lbImg.alt = img ? img.alt : "";
                lightbox.classList.add("is-open");
                lockScroll(true);
                lbClose.focus();
            });
        });
        lbClose.addEventListener("click", close);
        lightbox.addEventListener("click", function (event) { if (event.target === lightbox) close(); });
        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && lightbox.classList.contains("is-open")) close();
        });
    }

    // Jinja apartments: Airbnb and WhatsApp buttons
    document.querySelectorAll("[data-airbnb]").forEach(function (link) {
        if (!AIRBNB_URL) return;
        link.href = AIRBNB_URL;
        link.target = "_blank";
        link.rel = "noopener";
        link.hidden = false;
    });
    document.querySelectorAll("[data-whatsapp-jinja]").forEach(function (link) {
        link.href = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" +
            encodeURIComponent("Hello, I am interested in staying at Coronation Hotel Jinja (apartments). Is it available?");
    });

    // Footer year
    document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
