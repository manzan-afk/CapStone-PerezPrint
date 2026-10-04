import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { saveUserName } from "../services/userServices";
import "./ProfileInfo.css";

function formatDate(value) {
  const date = value?.toDate ? value.toDate() : null;
  return date
    ? date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "";
}

function Field({ label, value }) {
  return (
    <div className="profile-card__field">
      <dt>{label}</dt>
      <dd className={value ? "" : "profile-card__empty"}>{value || "Not provided"}</dd>
    </div>
  );
}

export default function ProfileInfo({ user, profile }) {
  const [imageFailed, setImageFailed] = useState(false);
  const { refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function startEditing() {
    setFirstName(profile?.firstName || "");
    setLastName(profile?.lastName || "");
    setError("");
    setEditing(true);
  }

  async function handleSave(event) {
    event.preventDefault();
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    if (!trimmedFirst || !trimmedLast) {
      setError("First name and last name are required.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await saveUserName(user.uid, trimmedFirst, trimmedLast);
      await refreshProfile();
      setEditing(false);
    } catch (err) {
      setError("Failed to save your name. Please try again.");
    } finally {
      setSaving(false);
    }
  }
  const fullName = `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim();
  const email = user?.email || profile?.email || "";
  const role = profile?.role
    ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
    : "";

  return (
    <div className="dashboard-content">
      <section className="profile-card">
        <div className="profile-card__hero">
          <div className="profile-card__avatar">
            {user?.photoURL && !imageFailed ? (
              <img src={user.photoURL} alt="Profile photo" onError={() => setImageFailed(true)} />
            ) : (
              <svg viewBox="0 0 24 24" width="38" height="38" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5Z"
                />
              </svg>
            )}
          </div>
          <div className="profile-card__identity">
            <h3>{fullName || "Name not set"}</h3>
            {email && <p>{email}</p>}
          </div>
          {role && <span className="profile-card__role">{role}</span>}
        </div>

        <div className="profile-card__section">
          <div className="profile-card__section-head">
            <h4>Personal details</h4>
            {!editing && (
              <button type="button" className="profile-card__edit-btn" onClick={startEditing}>
                Change name
              </button>
            )}
          </div>
          {editing && (
            <form className="profile-card__form" onSubmit={handleSave}>
              <div className="profile-card__grid">
                <label className="profile-card__input">
                  <span>First name</span>
                  <input
                    type="text"
                    autoFocus
                    maxLength={60}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </label>
                <label className="profile-card__input">
                  <span>Last name</span>
                  <input
                    type="text"
                    maxLength={60}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </label>
              </div>
              {error && <div className="profile-card__error">{error}</div>}
              <div className="profile-card__actions">
                <button type="submit" className="profile-card__save-btn" disabled={saving}>
                  {saving ? "Saving..." : "Save changes"}
                </button>
                <button
                  type="button"
                  className="profile-card__cancel-btn"
                  onClick={() => setEditing(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
          <dl className="profile-card__grid">
            {!editing && <Field label="First name" value={profile?.firstName} />}
            {!editing && <Field label="Last name" value={profile?.lastName} />}
            <Field label="Phone" value={profile?.phone} />
          </dl>
        </div>

        <div className="profile-card__section">
          <h4>Account</h4>
          <dl className="profile-card__grid">
            <Field label="Email" value={email} />
            <Field label="Role" value={role} />
            <Field label="Member since" value={formatDate(profile?.createdAt)} />
          </dl>
        </div>
      </section>
    </div>
  );
}
