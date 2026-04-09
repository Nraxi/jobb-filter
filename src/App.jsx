import React, { useState, useMemo } from "react";
import "./App.css";

const App = () => {
  // SÖK-STATE (API)
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [includeTags, setIncludeTags] = useState([]);
  const [excludeTags, setExcludeTags] = useState([]);
  const [includeInput, setIncludeInput] = useState("");
  const [excludeInput, setExcludeInput] = useState("");
  const [extent, setExtent] = useState("all");
  const [publishedDate, setPublishedDate] = useState("all");
  const [remoteOnly, setRemoteOnly] = useState(false);

  // DATA-STATE
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedJobId, setExpandedJobId] = useState(null);

  // LIVE-FILTER & SORTERING
  const [textFilter, setTextFilter] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "descending",
  });

  // TAGG-LOGIK
  const handleKeyDown = (e, type) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const value = e.target.value.trim().toLowerCase();
      if (!value) return;
      if (type === "include" && !includeTags.includes(value)) {
        setIncludeTags([...includeTags, value]);
        setIncludeInput("");
      } else if (type === "exclude" && !excludeTags.includes(value)) {
        setExcludeTags([...excludeTags, value]);
        setExcludeInput("");
      }
    }
  };

  const removeTag = (tagToRemove, type) => {
    if (type === "include")
      setIncludeTags(includeTags.filter((tag) => tag !== tagToRemove));
    else setExcludeTags(excludeTags.filter((tag) => tag !== tagToRemove));
  };

  // API-SÖKNING
  const searchJobs = async () => {
    if (!role && !location) return alert("Ange yrke eller stad.");
    setLoading(true);
    setError(null);
    setExpandedJobId(null);
    setTextFilter("");

    try {
      let allHits = [];
      for (let i = 0; i < 5; i++) {
        const offset = i * 100;
        const url = `https://jobsearch.api.jobtechdev.se/search?q=${encodeURIComponent(role)}&offset=${offset}&limit=100`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.hits && data.hits.length > 0)
          allHits = [...allHits, ...data.hits];
        else break;
      }

      const filtered = allHits.filter((job) => {
        const headline = (job.headline || "").toLowerCase();
        const description = (job.description?.text || "").toLowerCase();
        const jobCity = (job.workplace_address?.city || "").toLowerCase();
        const employer = (job.employer?.name || "").toLowerCase();

        // Hämta kontakter för filtrering
        const contacts = (job.application_contacts || [])
          .map((p) => `${p.name} ${p.description}`)
          .join(" ")
          .toLowerCase();

        const fullContent =
          `${headline} ${description} ${employer} ${jobCity} ${contacts}`.toLowerCase();

        const matchesLocation =
          !location || jobCity.includes(location.toLowerCase());
        const matchesInclude =
          includeTags.length === 0 ||
          includeTags.every((t) => fullContent.includes(t.toLowerCase()));
        const matchesExclude =
          excludeTags.length === 0 ||
          !excludeTags.some((t) => fullContent.includes(t.toLowerCase()));

        const matchesExtent =
          extent === "all" ||
          (job.employment_type?.label?.toLowerCase() || "").includes(extent);

        const pubDate = new Date(job.publication_date);
        const diffInHours = (new Date() - pubDate) / (1000 * 60 * 60);
        let matchesDate = true;
        if (publishedDate === "24h") matchesDate = diffInHours <= 24;
        else if (publishedDate === "3d") matchesDate = diffInHours <= 72;
        else if (publishedDate === "7d") matchesDate = diffInHours <= 168;
        else if (publishedDate === "30d") matchesDate = diffInHours <= 720;

        const remoteKeywords = ["distans", "remote", "hemifrån"];
        const matchesRemote =
          !remoteOnly || remoteKeywords.some((kw) => fullContent.includes(kw));

        return (
          matchesLocation &&
          matchesInclude &&
          matchesExclude &&
          matchesExtent &&
          matchesDate &&
          matchesRemote
        );
      });

      setJobs(filtered);
      if (filtered.length === 0) setError("Inga träffar matchade dina filter.");
    } catch (err) {
      setError("Tekniskt fel vid hämtning.");
    } finally {
      setLoading(false);
    }
  };

  // BEARBETNING: LIVE-FILTER + MULTI-SORTERING
  const processedJobs = useMemo(() => {
    let result = [...jobs];

    if (textFilter) {
      result = result.filter(
        (job) =>
          job.description?.text
            ?.toLowerCase()
            .includes(textFilter.toLowerCase()) ||
          job.headline?.toLowerCase().includes(textFilter.toLowerCase()),
      );
    }

    if (sortConfig.key) {
      result.sort((a, b) => {
        let valA, valB;
        if (sortConfig.key === "headline") {
          valA = a.headline?.toLowerCase() || "";
          valB = b.headline?.toLowerCase() || "";
        } else if (sortConfig.key === "employer") {
          valA = a.employer?.name?.toLowerCase() || "";
          valB = b.employer?.name?.toLowerCase() || "";
        } else if (sortConfig.key === "date") {
          valA = new Date(a.publication_date);
          valB = new Date(b.publication_date);
        }

        if (valA < valB) return sortConfig.direction === "ascending" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "ascending" ? 1 : -1;

        if (sortConfig.key !== "date") {
          return new Date(b.publication_date) - new Date(a.publication_date);
        }
        return 0;
      });
    }
    return result;
  }, [jobs, textFilter, sortConfig]);

  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return "—";
    return sortConfig.direction === "ascending" ? "▲" : "▼";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Ej angivet";
    return new Date(dateString).toLocaleDateString("sv-SE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatPubDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return "Idag";
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return "Igår";
    return date.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
  };

  return (
    <div className="page-background">
      <div className="top-container">
        <header className="header">
          <div className="logo">
            <span style={{ color: "#2563eb" }}>Jobb</span>
            <span style={{ color: "#eab308" }}>-filter</span>
          </div>
          <p className="subtitle">Filtrera bort bruset från Platsbanken</p>
        </header>

        <div className="search-card">
          <div className="input-row">
            <div className="input-group flex-2">
              <label className="label">Yrke / Roll</label>
              <input
                className="input-field"
                placeholder="t.ex. Projektledare"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>
            <div className="input-group flex-1">
              <label className="label">Stad</label>
              <input
                className="input-field"
                placeholder="Stockholm..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group-wrapper">
            <div className="input-group">
              <label className="label">Omfattning</label>
              <select
                className="select-input"
                value={extent}
                onChange={(e) => setExtent(e.target.value)}
              >
                <option value="all">Alla typer</option>
                <option value="heltid">Heltid</option>
                <option value="deltid">Deltid</option>
              </select>
            </div>
            <div className="input-group">
              <label className="label">Publicerad</label>
              <select
                className="select-input"
                value={publishedDate}
                onChange={(e) => setPublishedDate(e.target.value)}
              >
                <option value="all">När som helst</option>
                <option value="24h">Senaste 24h</option>
                <option value="3d">3 dagar</option>
                <option value="7d">Veckan</option>
                <option value="30d">Månaden</option>
              </select>
            </div>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={remoteOnly}
                onChange={(e) => setRemoteOnly(e.target.checked)}
              />
              🏠 Distans
            </label>
          </div>

          <div className="tag-section">
            <label className="label">Ska innehålla</label>
            <div className="tag-box" style={{ borderColor: "#10b981" }}>
              {includeTags.map((tag) => (
                <span key={tag} className="tag-green">
                  {tag}{" "}
                  <span
                    onClick={() => removeTag(tag, "include")}
                    className="tag-x"
                  >
                    ×
                  </span>
                </span>
              ))}
              <input
                className="ghost-input"
                placeholder="React, Excel..."
                value={includeInput}
                onChange={(e) => setIncludeInput(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, "include")}
              />
            </div>
          </div>

          <div className="tag-section">
            <label className="label">Ska INTE innehålla</label>
            <div className="tag-box" style={{ borderColor: "#ef4444" }}>
              {excludeTags.map((tag) => (
                <span key={tag} className="tag-red">
                  {tag}{" "}
                  <span
                    onClick={() => removeTag(tag, "exclude")}
                    className="tag-x"
                  >
                    ×
                  </span>
                </span>
              ))}
              <input
                className="ghost-input"
                placeholder="Senior, bemanning..."
                value={excludeInput}
                onChange={(e) => setExcludeInput(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, "exclude")}
              />
            </div>
          </div>

          <button onClick={searchJobs} disabled={loading} className="main-btn">
            {loading ? "Hämtar annonser..." : "Hitta matchande jobb"}
          </button>
        </div>
      </div>

      <div className="results-wrapper">
        {jobs.length > 0 && (
          <>
            <div className="live-filter-container">
              <input
                className="input-field"
                placeholder="🔍 Live-filtrera i resultatet (sök i texten)..."
                value={textFilter}
                onChange={(e) => setTextFilter(e.target.value)}
              />
            </div>

            <div className="results-header-row">
              <div className="col-annons">
                <div className="header-main-label">Annons / Företag</div>
                <div className="header-sub-sort">
                  <span
                    onClick={() => requestSort("headline")}
                    className={sortConfig.key === "headline" ? "active" : ""}
                  >
                    A-Z Annons {getSortIcon("headline")}
                  </span>
                  <span
                    onClick={() => requestSort("employer")}
                    className={sortConfig.key === "employer" ? "active" : ""}
                  >
                    A-Z Företag {getSortIcon("employer")}
                  </span>
                </div>
              </div>
              <div
                className="col-publicerad clickable"
                onClick={() => requestSort("date")}
              >
                Publicerad {getSortIcon("date")}
              </div>
            </div>
          </>
        )}

        {error && <div className="error-msg-box">{error}</div>}

        {processedJobs.map((job) => (
          <div key={job.id} className="job-card">
            <div
              className="job-header"
              onClick={() =>
                setExpandedJobId(expandedJobId === job.id ? null : job.id)
              }
            >
              <div className="job-info-col">
                <h3 className="job-title">{job.headline}</h3>
                <div className="job-meta-line">
                  <span style={{ color: "#2563eb" }}>{job.employer?.name}</span>
                  <span style={{ color: "#cbd5e1" }}>•</span>
                  <span>📍 {job.workplace_address?.city || "Sverige"}</span>
                </div>
              </div>
              <div className="job-date-col">
                {formatPubDate(job.publication_date)}
              </div>
              <div
                style={{
                  transform:
                    expandedJobId === job.id
                      ? "rotate(180deg)"
                      : "rotate(0deg)",
                  transition: "0.2s",
                  marginLeft: "15px",
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="2"
                >
                  <path d="M5 7l5 5 5-5" />
                </svg>
              </div>
            </div>

            {expandedJobId === job.id && (
              <div className="expanded-content">
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">💰 Lön</span>
                    <span className="info-value">
                      {job.salary_description || "Fast lön"}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">📅 Sista dag</span>
                    <span className="info-value">
                      {formatDate(job.application_deadline)}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">🏢 Omfattning</span>
                    <span className="info-value">
                      {job.employment_type?.label || "Heltid"}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">🚀 Ansökan</span>
                    <span className="info-value">
                      {job.application_details?.url ? (
                        <a
                          href={job.application_details.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "#10b981", fontWeight: "800" }}
                        >
                          Sök direkt ↗
                        </a>
                      ) : job.application_details?.email ? (
                        <a
                          href={`mailto:${job.application_details.email}?subject=Ansökan: ${encodeURIComponent(job.headline)}${job.application_details.reference ? ` (Ref: ${encodeURIComponent(job.application_details.reference)})` : ""}`}
                          style={{ color: "#2563eb", fontWeight: "800" }}
                        >
                          Sök via mail ✉️
                        </a>
                      ) : (
                        "Se annonstext"
                      )}
                    </span>
                  </div>

                  {/* REFERENSNUMMER VID MAIL */}
                  {!job.application_details?.url &&
                    job.application_details?.reference && (
                      <div className="info-item">
                        <span className="info-label">🆔 Referens</span>
                        <span
                          className="info-value"
                          style={{ fontSize: "0.8rem" }}
                        >
                          {job.application_details.reference}
                        </span>
                      </div>
                    )}

                  {/* HEMSIDA */}
                  {job.employer?.url && (
                    <div className="info-item">
                      <span className="info-label">🌐 Hemsida</span>
                      <span className="info-value">
                        <a
                          href={job.employer.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "#2563eb" }}
                        >
                          Besök sida ↗
                        </a>
                      </span>
                    </div>
                  )}

                  {/* KONTAKTPERSONER */}
                  {job.application_contacts &&
                    job.application_contacts.length > 0 && (
                      <div
                        className="info-item"
                        style={{
                          gridColumn: "1 / -1",
                          marginTop: "10px",
                          borderTop: "1px solid #e2e8f0",
                          paddingTop: "15px",
                        }}
                      >
                        <span className="info-label">👤 Kontaktperson</span>
                        {job.application_contacts.map((contact, index) => (
                          <div key={index} style={{ marginTop: "5px" }}>
                            <span
                              className="info-value"
                              style={{ display: "block", color: "#1e40af" }}
                            >
                              {contact.name}{" "}
                              {contact.description &&
                                `(${contact.description})`}
                            </span>
                            <div
                              style={{
                                display: "flex",
                                gap: "15px",
                                marginTop: "2px",
                              }}
                            >
                              {contact.email && (
                                <a
                                  href={`mailto:${contact.email}`}
                                  className="contact-link-blue"
                                >
                                  ✉️ {contact.email}
                                </a>
                              )}
                              {contact.telephone && (
                                <a
                                  href={`tel:${contact.telephone}`}
                                  className="contact-link-blue"
                                >
                                  📞 {contact.telephone}
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </div>

                <div className="job-text">{job.description?.text}</div>

                <div className="button-row">
                  {job.application_details?.url ? (
                    <a
                      href={job.application_details.url}
                      target="_blank"
                      rel="noreferrer"
                      className="apply-btn-primary"
                    >
                      Sök tjänsten direkt 🚀
                    </a>
                  ) : job.application_details?.email ? (
                    <a
                      href={`mailto:${job.application_details.email}?subject=Ansökan: ${encodeURIComponent(job.headline)}`}
                      className="apply-btn-primary"
                      style={{ backgroundColor: "#2563eb" }}
                    >
                      Maila ansökan ✉️
                    </a>
                  ) : null}
                  <a
                    href={job.webpage_url}
                    target="_blank"
                    rel="noreferrer"
                    className="apply-btn-secondary"
                  >
                    Visa på Platsbanken →
                  </a>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
