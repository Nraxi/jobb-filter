import React, { useState } from "react";

const App = () => {
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [includeTags, setIncludeTags] = useState([]);
  const [excludeTags, setExcludeTags] = useState([]);
  const [includeInput, setIncludeInput] = useState("");
  const [excludeInput, setExcludeInput] = useState("");
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
    if (type === "include") {
      setIncludeTags(includeTags.filter((tag) => tag !== tagToRemove));
    } else {
      setExcludeTags(excludeTags.filter((tag) => tag !== tagToRemove));
    }
  };

  const searchJobs = async () => {
    if (!role && !location) return alert("Ange yrke eller stad.");
    setLoading(true);
    setError(null);
    setJobs([]);
    setExpandedJobId(null);

    try {
      const url = `https://jobsearch.api.jobtechdev.se/search?q=${encodeURIComponent(role)}&limit=100`;
      const response = await fetch(url);
      const data = await response.json();

      if (!data.hits || data.hits.length === 0) {
        setError("Inga annonser hittades.");
        return;
      }

      const filtered = data.hits.filter((job) => {
        const jobCity = (job.workplace_address?.city || "").toLowerCase();
        const headline = (job.headline || "").toLowerCase();
        const description = (job.description?.text || "").toLowerCase();
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

        return matchesLocation && matchesInclude && matchesExclude;
      });

      setJobs(filtered);
      if (filtered.length === 0) setError("Inga träffar matchade dina filter.");
    } catch (err) {
      setError("Nätverksfel.");
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

  return (
    <div style={styles.pageBackground}>
      <div style={styles.topContainer}>
        <header style={styles.header}>
          <div style={styles.logo}>
            <span style={{ color: "#2563eb" }}>Jobb</span>
            <span style={{ color: "#eab308" }}>-filter</span>{" "}
            <span style={{ color: "#2563eb" }}>Sverige</span>
          </div>
          
<br/>
          <p style={styles.subtitle}>Filtrera bort bruset från Platsbanken</p>
        </header>
        <div style={styles.searchCard}>
          <div style={styles.inputRow}>
            <div style={{ flex: 2 }}>
              <label style={styles.label}>Yrke / Roll</label>
              <input
                style={styles.input}
                placeholder="t.ex. Projektledare"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>Stad</label>
              <input
                style={styles.input}
                placeholder="Göteborg..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={styles.label}>Ska innehålla (Enter)</label>
            <div style={{ ...styles.tagBox, borderColor: "#10b981" }}>
              {includeTags.map((tag) => (
                <span key={tag} style={styles.tagGreen}>
                  {tag}{" "}
                  <span
                    onClick={() => removeTag(tag, "include")}
                    style={styles.tagX}
                  >
                    ×
                  </span>
                </span>
              ))}
              <input
                style={styles.ghostInput}
                placeholder={
                  includeTags.length === 0 ? "Färdigheter, nyckelord..." : ""
                }
                value={includeInput}
                onChange={(e) => setIncludeInput(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, "include")}
              />
            </div>
          </div>

          <div>
            <label style={styles.label}>Ska INTE innehålla (Enter)</label>
            <div style={{ ...styles.tagBox, borderColor: "#ef4444" }}>
              {excludeTags.map((tag) => (
                <span key={tag} style={styles.tagRed}>
                  {tag}{" "}
                  <span
                    onClick={() => removeTag(tag, "exclude")}
                    style={styles.tagX}
                  >
                    ×
                  </span>
                </span>
              ))}
              <input
                style={styles.ghostInput}
                placeholder={
                  excludeTags.length === 0 ? "Dölj oönskade ord..." : ""
                }
                value={excludeInput}
                onChange={(e) => setExcludeInput(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, "exclude")}
              />
            </div>
          </div>

          <button
            onClick={searchJobs}
            disabled={loading}
            style={styles.mainBtn}
          >
            {loading ? "Söker..." : "Hitta matchande jobb"}
          </button>
        </div>

        {error && <div style={styles.error}>{error}</div>}
      </div>

      <div style={styles.resultsWrapper}>
        <div style={styles.resultsInner}>
          {jobs.length > 0 && (
            <div style={styles.count}>Hittade {jobs.length} annonser</div>
          )}

          {jobs.map((job) => (
            <div key={job.id} style={styles.jobCard}>
              <div
                style={styles.jobHeader}
                onClick={() =>
                  setExpandedJobId(expandedJobId === job.id ? null : job.id)
                }
              >
                <div style={{ flex: 1 }}>
                  <h3 style={styles.jobTitle}>{job.headline}</h3>
                  <div style={styles.jobMeta}>
                    <span style={styles.company}>{job.employer?.name}</span>
                    <span style={styles.dot}>•</span>
                    <span style={styles.city}>
                      📍 {job.workplace_address?.city || "Sverige"}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    transform:
                      expandedJobId === job.id
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                    transition: "0.2s",
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="2"
                  >
                    <path d="M5 7l5 5 5-5" />
                  </svg>
                </div>
              </div>

              {expandedJobId === job.id ? (
                <div style={styles.jobDetail}>
                  <div style={styles.infoGrid}>
                    <div style={styles.infoItem}>
                      <span style={styles.infoLabel}>💰 Lön</span>
                      <span style={styles.infoValue}>
                        {job.salary_description ||
                          job.salary_type?.label ||
                          "Fast lön"}
                      </span>
                    </div>
                    <div style={styles.infoItem}>
                      <span style={styles.infoLabel}>
                        📅 Sista ansökningsdag
                      </span>
                      <span style={styles.infoValue}>
                        {formatDate(job.application_deadline)}
                      </span>
                    </div>
                    <div style={styles.infoItem}>
                      <span style={styles.infoLabel}>🏢 Arbetsgivare</span>
                      <span style={styles.infoValue}>
                        {job.employer?.name}
                        {job.employer?.url && (
                          <a
                            href={job.employer.url}
                            target="_blank"
                            rel="noreferrer"
                            style={styles.smallLink}
                          >
                            Besök hemsida ↗
                          </a>
                        )}
                      </span>
                    </div>
                    <div style={styles.infoItem}>
                      <span style={styles.infoLabel}>📍 Arbetsplats</span>
                      <span style={styles.infoValue}>
                        {job.workplace_address?.municipality ||
                          job.workplace_address?.city}
                        , {job.workplace_address?.region}
                      </span>
                    </div>
                    {/* NYTT: DIREKTLÄNK TILL ANSÖKAN */}
                    <div style={{ ...styles.infoItem, gridColumn: "1 / -1" }}>
                      <span style={styles.infoLabel}>🔗 Hur du ansöker</span>
                      <span style={styles.infoValue}>
                        {job.application_details?.url ? (
                          <a
                            href={job.application_details.url}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              color: "#2563eb",
                              textDecoration: "underline",
                            }}
                          >
                            Gå direkt till ansökningsformulär ↗
                          </a>
                        ) : (
                          "Använd länken längst ner för att ansöka via Platsbanken."
                        )}
                      </span>
                    </div>
                  </div>

                  {job.application_contacts &&
                    job.application_contacts.length > 0 && (
                      <div style={styles.contactSection}>
                        <h4 style={styles.smallHeading}>Kontaktpersoner</h4>
                        <div style={styles.contactGrid}>
                          {job.application_contacts.map((contact, idx) => (
                            <div key={idx} style={styles.contactCard}>
                              <span style={styles.contactName}>
                                {contact.name || "Namn saknas"}
                              </span>
                              <span style={styles.contactRole}>
                                {contact.description || "Kontaktperson"}
                              </span>
                              <div style={styles.contactMethods}>
                                {contact.email && (
                                  <span style={styles.contactLink}>
                                    📧 {contact.email}
                                  </span>
                                )}
                                {contact.telephone && (
                                  <span style={styles.contactLink}>
                                    📞 {contact.telephone}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  <div style={styles.jobText}>{job.description?.text}</div>
                  <a
                    href={job.webpage_url}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.applyBtn}
                  >
                    Visa hela annonsen på Platsbanken →
                  </a>
                </div>
              ) : (
                <p style={styles.jobExcerpt}>
                  {job.description?.text?.slice(0, 160)}...
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const styles = {
  pageBackground: {
    backgroundColor: "#f8fafc",
    minHeight: "100vh",
    width: "100%",
    boxSizing: "border-box",
  },
  topContainer: {
    maxWidth: "800px",
    margin: "0 auto",
    padding: "40px 20px 20px 20px",
    boxSizing: "border-box",
  },
  header: { textAlign: "center", marginBottom: "30px" },
  logo: { fontSize: "2.4rem", fontWeight: "900", letterSpacing: "-1.5px" },
  subtitle: { color: "#64748b", fontSize: "1rem" },
  searchCard: {
    background: "#ffffff",
    padding: "32px",
    borderRadius: "24px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    border: "1px solid #e2e8f0",
    boxSizing: "border-box",
  },
  inputRow: { display: "flex", gap: "16px" },
  label: {
    display: "block",
    fontSize: "0.85rem",
    fontWeight: "700",
    marginBottom: "6px",
    color: "#475569",
    textTransform: "uppercase",
  },
  input: {
    width: "100%",
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    fontSize: "1rem",
    outline: "none",
    boxSizing: "border-box",
  },
  tagBox: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    padding: "10px",
    border: "2px solid #f1f5f9",
    borderRadius: "12px",
    background: "#fcfdfe",
    alignItems: "center",
    boxSizing: "border-box",
  },
  ghostInput: {
    border: "none",
    outline: "none",
    flex: 1,
    fontSize: "0.95rem",
    background: "transparent",
    minWidth: "150px",
  },
  tagGreen: {
    background: "#dcfce7",
    color: "#166534",
    padding: "6px 12px",
    borderRadius: "8px",
    fontSize: "0.85rem",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  tagRed: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "6px 12px",
    borderRadius: "8px",
    fontSize: "0.85rem",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  tagX: { cursor: "pointer", fontSize: "18px" },
  mainBtn: {
    padding: "18px",
    background: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "14px",
    fontWeight: "700",
    fontSize: "1rem",
    cursor: "pointer",
  },
  resultsWrapper: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    padding: "20px",
    boxSizing: "border-box",
  },
  resultsInner: {
    maxWidth: "1000px",
    width: "100%",
    display: "flex",
    flexDirection: "column",
  },
  count: {
    fontSize: "0.9rem",
    color: "#64748b",
    marginBottom: "16px",
    fontWeight: "600",
    textAlign: "right",
  },
  jobCard: {
    background: "#ffffff",
    padding: "24px",
    borderRadius: "20px",
    border: "1px solid #f1f5f9",
    marginBottom: "16px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
    width: "100%",
    boxSizing: "border-box",
    overflowWrap: "anywhere",
    wordBreak: "break-word",
  },
  jobHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    cursor: "pointer",
  },
  jobTitle: {
    margin: "0 0 6px 0",
    fontSize: "1.15rem",
    fontWeight: "800",
    color: "#0f172a",
  },
  jobMeta: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "0.9rem",
  },
  company: { color: "#2563eb", fontWeight: "700" },
  dot: { color: "#cbd5e1" },
  city: { color: "#64748b" },
  jobExcerpt: {
    color: "#475569",
    fontSize: "0.95rem",
    lineHeight: "1.6",
    marginTop: "14px",
  },
  jobDetail: {
    marginTop: "20px",
    paddingTop: "20px",
    borderTop: "2px solid #f8fafc",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
    marginBottom: "20px",
    background: "#f8fafc",
    padding: "20px",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
  },
  infoItem: { display: "flex", flexDirection: "column", gap: "4px" },
  infoLabel: {
    fontSize: "0.75rem",
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  infoValue: { fontSize: "0.9rem", color: "#1e293b", fontWeight: "600" },
  contactSection: { marginBottom: "30px", padding: "0 10px" },
  smallHeading: {
    fontSize: "0.9rem",
    fontWeight: "800",
    marginBottom: "12px",
    color: "#1e293b",
    textTransform: "uppercase",
  },
  contactGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "12px",
  },
  contactCard: {
    padding: "12px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
  },
  contactName: {
    display: "block",
    fontSize: "0.95rem",
    fontWeight: "700",
    color: "#2563eb",
  },
  contactRole: {
    display: "block",
    fontSize: "0.8rem",
    color: "#64748b",
    marginBottom: "8px",
  },
  contactMethods: { display: "flex", flexDirection: "column", gap: "4px" },
  contactLink: { fontSize: "0.85rem", color: "#334155" },
  smallLink: {
    marginLeft: "8px",
    color: "#2563eb",
    textDecoration: "none",
    fontSize: "0.8rem",
  },
  jobText: {
    fontSize: "0.95rem",
    lineHeight: "1.8",
    color: "#334155",
    whiteSpace: "pre-wrap",
  },
  applyBtn: {
    display: "block",
    marginTop: "24px",
    background: "#2563eb",
    color: "#ffffff",
    textAlign: "center",
    padding: "14px",
    borderRadius: "12px",
    textDecoration: "none",
    fontWeight: "700",
  },
  error: {
    padding: "20px",
    background: "#fef2f2",
    color: "#991b1b",
    borderRadius: "16px",
    border: "1px solid #fee2e2",
    textAlign: "center",
    marginTop: "20px",
  },
};

export default App;
