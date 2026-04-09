import React, { useState } from "react";
import "./App.css";

const App = () => {
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [includeTags, setIncludeTags] = useState([]);
  const [excludeTags, setExcludeTags] = useState([]);
  const [includeInput, setIncludeInput] = useState("");
  const [excludeInput, setExcludeInput] = useState("");
  const [extent, setExtent] = useState("all");
  const [publishedDate, setPublishedDate] = useState("all");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedJobId, setExpandedJobId] = useState(null);

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

  const searchJobs = async () => {
    if (!role && !location) return alert("Ange yrke eller stad.");
    setLoading(true);
    setError(null);
    setJobs([]);
    setExpandedJobId(null);

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
        const fullContent = `${headline} ${description} ${employer} ${jobCity}`;

        const matchesLocation =
          !location || jobCity.includes(location.toLowerCase());
        const matchesInclude =
          includeTags.length === 0 ||
          includeTags.every((t) => fullContent.includes(t));
        const matchesExclude =
          excludeTags.length === 0 ||
          !excludeTags.some((t) => fullContent.includes(t));
        const matchesExtent =
          extent === "all" ||
          (job.employment_type?.label?.toLowerCase() || "").includes(extent);

        const pubDate = new Date(job.publication_date);
        const diffInHours = (new Date() - pubDate) / (1000 * 60 * 60);
        let matchesDate = true;
        if (publishedDate === "24h") matchesDate = diffInHours <= 24;
        else if (publishedDate === "3d") matchesDate = diffInHours <= 72;

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
      setError("Tekniskt fel.");
    } finally {
      setLoading(false);
    }
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
            <div style={{ flex: 2 }}>
              <label className="label">Yrke / Roll</label>
              <input
                className="input-field"
                placeholder="t.ex. Projektledare"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>
            <div style={{ flex: 1 }}>
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
            <div>
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
            <div>
              <label className="label">Publicerad</label>
              <select
                className="select-input"
                value={publishedDate}
                onChange={(e) => setPublishedDate(e.target.value)}
              >
                <option value="all">När som helst</option>
                <option value="24h">Senaste 24h</option>
                <option value="3d">Senaste 3 dagarna</option>
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

          <div>
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
                placeholder="Lägg till ord..."
                value={includeInput}
                onChange={(e) => setIncludeInput(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, "include")}
              />
            </div>
          </div>

          <div>
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
                placeholder="Dölj ord..."
                value={excludeInput}
                onChange={(e) => setExcludeInput(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, "exclude")}
              />
            </div>
          </div>

          <button onClick={searchJobs} disabled={loading} className="main-btn">
            {loading ? "Söker..." : "Hitta matchande jobb"}
          </button>
        </div>
      </div>

      <div className="results-wrapper">
        {jobs.length > 0 && (
          <div className="results-header-row">
            <div className="col-annons">Annons / Företag</div>
            <div className="col-publicerad">Publicerad</div>
          </div>
        )}

        {jobs.map((job) => (
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
                    <span className="info-label">📍 Plats</span>
                    <span className="info-value">
                      {job.workplace_address?.city || "Göteborg"}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">🔗 Hemsida</span>
                    <span className="info-value">
                      {job.employer?.url ? (
                        <a
                          href={job.employer.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "#2563eb" }}
                        >
                          Företag ↗
                        </a>
                      ) : (
                        "Ej angiven"
                      )}
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
                      ) : (
                        "Se nedan"
                      )}
                    </span>
                  </div>
                </div>

                {job.application_contacts?.length > 0 && (
                  <div className="contact-box">
                    <span
                      className="info-label"
                      style={{
                        color: "#2563eb",
                        marginBottom: "8px",
                        display: "block",
                      }}
                    >
                      Kontaktuppgifter
                    </span>
                    {job.application_contacts.map((c, i) => (
                      <div key={i} style={{ marginBottom: "10px" }}>
                        <span className="contact-name">{c.name}</span>
                        {c.description && (
                          <span className="contact-desc">{c.description}</span>
                        )}
                        {c.email && (
                          <a
                            href={`mailto:${c.email}`}
                            className="contact-link-blue"
                          >
                            📧 {c.email}
                          </a>
                        )}
                        {c.telephone && (
                          <span style={{ fontSize: "0.9rem" }}>
                            📞 {c.telephone}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="job-text">{job.description?.text}</div>

                <div className="button-row">
                  {job.application_details?.url && (
                    <a
                      href={job.application_details.url}
                      target="_blank"
                      rel="noreferrer"
                      className="apply-btn-primary"
                    >
                      Sök tjänsten direkt 🚀
                    </a>
                  )}
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
