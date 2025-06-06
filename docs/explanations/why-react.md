
# Why We Chose Django + React + Webpack (and not Next.js)

At the heart of our technical decision-making is a desire to balance **developer autonomy**, **ecosystem support**, and **architectural clarity**. For the Kura Zetu project, we chose **React** with a **Webpack-based SPA architecture**, rather than adopting **Next.js** or a similar framework. Here's why.

## React Won

Let’s begin with what is indisputable: **React has won** the frontend war — not by force, but by versatility. Its component model, vast community, rich ecosystem, and adaptability across use cases (including mobile via React Native) make it the most accessible and future-proof UI library today.

This flexibility is critical to our project. We are engaging **a diverse set of contributors** — from experienced engineers to students and open-source newcomers. React, as a library, meets them where they are. It is easy to get help via community forums, LLMs, and abundant learning materials. A framework like Next.js, despite its power, introduces a **heavier conceptual and technical overhead**, especially for developers not already versed in its conventions.

## Why Not Next.js?

While Next.js offers many advantages — especially for SSR, SEO, and file-based routing — we consciously **rejected it** for this project. This decision was not made in ignorance of its features, but **in protest of its philosophical imposition**.

> *Let people use something because they want to, not because you want them to.*

The current direction from the React core team feels increasingly coercive. The official React documentation now **defaults to frameworks like Next.js**, marginalizing SPA patterns and removing documentation for simpler setups like Vite, CRA, or Webpack. What made React thrive was its **pluralism** — the freedom to embed it anywhere and use it any way. React Native itself was born from this freedom.

``` {important}
We are not against Next.js. We are against the **ideological pressure** to use it, especially when it is not needed.
```

We reject the current trend of **developer experience virtue signalling**. For our use case — a client-heavy, non-SEO-sensitive, real-time election data dashboard — **React as an SPA is perfectly adequate**. We don’t need SSR, hybrid routing, or per-page code splitting. We need **simplicity**, **control**, and **predictability**.

Even if the community later votes to adopt Next.js (and we will respect that democratic process), we want it to be a choice made out of **need and alignment**, not out of **ideological pressure**.

## Why not Vite?

Vite is a great tool, an we love it. We would welcome a PR to migrate our current setup to Vite.

## Why Django?

For the backend, we chose **Django**, not because it’s trendy, but because it’s **reliable** and **battle-tested**, especially in the geospatial domain. Its first-class support for:

* **PostgreSQL + PostGIS**
* **GDAL and GEOS**
* **RESTful APIs via Django REST Framework**
* **CORS**
* **Rate limiting**
* **Background tasks (via Celery or channels)**
* **Admin dashboards**
* **Permission and auth systems**
* **ORM with geospatial queries**

This makes it the best possible foundation for a platform like ours, where **data integrity**, **geospatial accuracy**, and **rapid iteration** are paramount.

We also rejected the idea of going **serverless**, which we consider unsuitable for this class of problem. Serverless architectures tend to obscure state, are poor at long-running or location-specific data processing, and often introduce more complexity than they remove.

---

In summary, we believe in building software that is technically sound, **philosophically honest**, and **community-driven**. React + Webpack gives us that flexibility on the frontend. Django + PostGIS gives us power and maturity on the backend.

And above all, we choose tools **because they solve our problems**, not because someone told us to.
