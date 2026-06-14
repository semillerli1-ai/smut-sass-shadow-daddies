import { useEffect, useState } from "react";
import "./style.css";
import { supabase } from "./supabaseClient";

const CLUB_CODE = "SHADOWDADDY";
const ADMIN_CODE = "SHADOWQUEEN";

export default function App() {
  const [avatar, setAvatar] = useState("");
  const [membersMap, setMembersMap] = useState({});
  const [access, setAccess] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [clubCode, setClubCode] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [memberName, setMemberName] = useState("");
  const [attendance, setAttendance] = useState([]);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false)
  const AVATARS = Array.from({ length: 8 }, (_, i) =>
    `https://jepinzaptcydbczofaup.supabase.co/storage/v1/object/public/avatar/avatar${i + 1}.png`
  );

  function getBookCover(title, author) {
    const query = encodeURIComponent(`${title} ${author}`);
    return `https://covers.openlibrary.org/b/olid/$(query)-M.jpg`;
  }

  const [page, setPage] = useState("home");
  const [libraryPage, setLibraryPage] = useState("suggestions");
  const [communityPage, setCommunityPage] = useState("notes");

  const [meetings, setMeetings] = useState([]);
  const [archiveMeetings, setArchiveMeetings] = useState([]);
  const [books, setBooks] = useState([]);
  const [votes, setVotes] = useState([]);
  const [notes, setNotes] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [similarBooks, setSimilarBooks] = useState([]);
  const [feedback, setFeedback] = useState([]);

  const [bookTitle, setBookTitle] = useState("");
  const [bookAuthor, setBookAuthor] = useState("");
  const [whyRead, setWhyRead] = useState("");

  const [note, setNote] = useState("");
  const [noteType, setNoteType] = useState("Question");

  const [selectedArchive, setSelectedArchive] = useState(null);

  const [similarTitle, setSimilarTitle] = useState("");
  const [similarAuthor, setSimilarAuthor] = useState("");
  const [similarReason, setSimilarReason] = useState("");

  const [feedbackType, setFeedbackType] = useState("App idea");
  const [feedbackText, setFeedbackText] = useState("");

  const [newMeetingDate, setNewMeetingDate] = useState("");
  const [newMeetingTime, setNewMeetingTime] = useState("");
  const [newMeetingBook, setNewMeetingBook] = useState("");
  const [newMeetingAuthor, setNewMeetingAuthor] = useState("");

  useEffect(() => {
    const savedName = localStorage.getItem("memberName");
    const savedAccess = localStorage.getItem("clubAccess");
    const savedAdmin = localStorage.getItem("isAdmin");
    const savedAvatar = localStorage.getItem("avatar");

    if (savedName) setMemberName(savedName);
    if (savedAccess === "true") setAccess(true);
    if (savedAdmin === "true") setIsAdmin(true);
    if (savedAvatar) setAvatar(savedAvatar);
  }, []);

  useEffect(() => {
    if (access) loadEverything();
    loadMembers();
  }, [access]);

  async function loadEverything() {
    loadMeetings();
    loadBooks();
    loadVotes();
    loadNotes();
    loadRatings();
    loadSimilarBooks();
    loadFeedback();
    loadAttendance();
  }

  async function loadMembers() {
    const { data } = await supabase.from("members").select("*");
    if (data) {
      const map = {};
      data.forEach(m => { map[m.member_name] = m.avatar_url; });
      setMembersMap(map);
    }
  }

  async function loadMeetings() {
    const { data } = await supabase
      .from("meetings")
      .select("*")
      .order("meeting_date");

    if (!data) return;

    const upcoming = [];
    const archived = [];

    data.forEach((m) => {
      const meetingDate = new Date(m.meeting_date);
      const now = new Date();
      const diff = (now - meetingDate) / (1000 * 60 * 60 * 24);

      if (diff > 1) archived.push(m);
      else upcoming.push(m);
    });

    setMeetings(upcoming.slice(0, 3));
    setArchiveMeetings(archived);
  }

  async function loadBooks() {
    const { data } = await supabase
      .from("book_suggestions")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setBooks(data);
  }

  async function loadVotes() {
    const { data } = await supabase.from("votes").select("*");
    if (data) setVotes(data);
  }

  async function loadNotes() {
    const { data } = await supabase
      .from("notes")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setNotes(data);
  }

  async function loadRatings() {
    const { data } = await supabase.from("book_ratings").select("*");
    if (data) setRatings(data);
  }

  async function loadSimilarBooks() {
    const { data } = await supabase
      .from("similar_books")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setSimilarBooks(data);
  }

  async function loadFeedback() {
    const { data } = await supabase
      .from("app_feedback")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setFeedback(data);
  }

  async function loadAttendance() {
    const { data } = await supabase.from("attendance").select("*");
    if (data) setAttendance(data);
  }

  async function toggleAttendance(meetingId) {
    const existing = attendance.find(
      a => a.meeting_id === meetingId && a.member_name === memberName
    );

    if (existing) {
      await supabase.from("attendance").delete().eq("id", existing.id);
    } else {
      await supabase.from("attendance").insert({
        meeting_id: meetingId,
        member_name: memberName
      });
    }
    loadAttendance();
  }

  function isAttending(meetingId) {
    return attendance.find(
      a => a.meeting_id === meetingId && a.member_name === memberName
    );
  }

  function attendeesForMeeting(meetingId) {
    return attendance.filter(a => a.meeting_id === meetingId);
  }

  async function enterApp() {
    if (clubCode === CLUB_CODE && memberName.trim() && avatar) {
      await supabase.from("members").upsert(
        { member_name: memberName, avatar_url: avatar },
        { onConflict: "member_name" }
      );

      setAccess(true);
      localStorage.setItem("clubAccess", "true");
      localStorage.setItem("memberName", memberName);
      localStorage.setItem("avatar", avatar);

      if (adminCode === ADMIN_CODE) {
        setIsAdmin(true);
        localStorage.setItem("isAdmin", "true");
      }
    }
  }

  function logout() {
    localStorage.removeItem("clubAccess");
    localStorage.removeItem("isAdmin");
    setAccess(false);
    setIsAdmin(false);
    setClubCode("");
    setAdminCode("");
  }

  async function addBook() {
    if (!bookTitle.trim()) return;

    await supabase.from("book_suggestions").insert({
      title: bookTitle,
      author: bookAuthor,
      why_read: whyRead,
      description: "",
      suggested_by: memberName
    });

    setBookTitle("");
    setBookAuthor("");
    setWhyRead("");
    loadBooks();
  }

  async function vote(bookId) {
    const existing = votes.find(
      (v) => v.suggestion_id === bookId && v.member_name === memberName
    );

    if (existing) {
      await supabase.from("votes").delete().eq("id", existing.id);
    } else {
      await supabase.from("votes").insert({
        suggestion_id: bookId,
        member_name: memberName
      });
    }

    loadVotes();
  }

  async function selectAsNextBook(book) {
    const date = prompt("Meeting date? Use YYYY-MM-DD");
    const time = prompt("Meeting time? Use HH:MM, e.g. 19:30");

    if (!date || !time) return;

    await supabase.from("meetings").insert({
      meeting_date: date,
      meeting_time: time,
      book_title: book.title,
      author: book.author,
      vibe: "Chosen by book club vote"
    });

    await supabase.from("book_suggestions").delete().eq("id", book.id);

    loadEverything();
  }

  async function addNote() {
    if (!note.trim() || !meetings[0]) return;

    await supabase.from("notes").insert({
      note_text: note,
      member_name: memberName,
      note_type: noteType,
      meeting_id: meetings[0].id
    });

    setNote("");
    loadNotes();
  }

  async function rateBook(meetingId, rating) {
    await supabase.from("book_ratings").upsert(
      {
        meeting_id: meetingId,
        member_name: memberName,
        rating
      },
      {
        onConflict: "meeting_id,member_name"
      }
    );

    loadRatings();
  }

  async function addSimilarBook(meetingId) {
    if (!similarTitle.trim()) return;

    await supabase.from("similar_books").insert({
      meeting_id: meetingId,
      title: similarTitle,
      author: similarAuthor,
      reason: similarReason,
      recommended_by: memberName
    });

    setSimilarTitle("");
    setSimilarAuthor("");
    setSimilarReason("");
    loadSimilarBooks();
  }

  async function addFeedback() {
    if (!feedbackText.trim()) return;

    await supabase.from("app_feedback").insert({
      feedback_type: feedbackType,
      feedback_text: feedbackText,
      member_name: memberName
    });

    setFeedbackText("");
    loadFeedback();
  }

  async function addMeeting() {
    if (!newMeetingDate || !newMeetingTime || !newMeetingBook) return;

    await supabase.from("meetings").insert({
      meeting_date: newMeetingDate,
      meeting_time: newMeetingTime,
      book_title: newMeetingBook,
      author: newMeetingAuthor,
      vibe: "Admin added meeting"
    });

    setNewMeetingDate("");
    setNewMeetingTime("");
    setNewMeetingBook("");
    setNewMeetingAuthor("");
    loadMeetings();
  }

  function getBookCover(title) {
    const query = encodeURIComponent(title);
    return `https://covers.openlibrary.org/b/title/${query}-M.jpg?default=false`;
  }

  function voteCount(bookId) {
    return votes.filter((v) => v.suggestion_id === bookId).length;
  }

  function userVoted(bookId) {
    return votes.find(
      (v) => v.suggestion_id === bookId && v.member_name === memberName
    );
  }

  function topThreeBooks() {
    return [...books]
      .sort((a, b) => voteCount(b.id) - voteCount(a.id))
      .slice(0, 3);
  }

  function notesForMeeting(meetingId) {
    return notes.filter((n) => n.meeting_id === meetingId);
  }

  function visibleNotesForCurrentMeeting() {
    if (!meetings[0]) return [];

    const meetingDate = new Date(meetings[0].meeting_date);
    const now = new Date();
    const hoursUntil = (meetingDate - now) / (1000 * 60 * 60);
    const unlocked = hoursUntil <= 24;

    const current = notesForMeeting(meetings[0].id);

    if (unlocked) return current;
    return current.filter((n) => n.member_name === memberName);
  }

  function notesUnlocked() {
    if (!meetings[0]) return false;

    const meetingDate = new Date(meetings[0].meeting_date);
    const now = new Date();
    const hoursUntil = (meetingDate - now) / (1000 * 60 * 60);

    return hoursUntil <= 24;
  }

  function groupedNotes(noteList) {
    const groups = {
      Question: [],
      Theory: [],
      "Favourite Moment": [],
      Other: []
    };

    noteList.forEach((n) => {
      const type = n.note_type || "Other";
      if (!groups[type]) groups[type] = [];
      groups[type].push(n);
    });

    return groups;
  }

  function ratingsForMeeting(meetingId) {
    return ratings.filter((r) => r.meeting_id === meetingId);
  }

  function averageRating(meetingId) {
    const list = ratingsForMeeting(meetingId);
    if (!list.length) return "No ratings yet";

    const avg = list.reduce((sum, r) => sum + r.rating, 0) / list.length;
    return `${avg.toFixed(1)} ⭐`;
  }

  function myRating(meetingId) {
    return ratings.find(
      (r) => r.meeting_id === meetingId && r.member_name === memberName
    );
  }

  function similarForMeeting(meetingId) {
    return similarBooks.filter((b) => b.meeting_id === meetingId);
  }

  function shareWhatsApp() {
    const text = encodeURIComponent(
      `Join Smut, Sass and Shadow Daddies ✨ ${window.location.href}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!access) {
    return (
      <div className="clubgate">
        <div className="title-wrap">
          <svg className="rose-deco" viewBox="0 0 300 60" xmlns="http://www.w3.org/2000/svg">
            <g opacity="0.7">
              <circle cx="150" cy="30" r="8" fill="none" stroke="#f9c5d5" strokeWidth="1" />
              <circle cx="150" cy="30" r="4" fill="#f9c5d5" opacity="0.6" />
              <path d="M100 30 Q120 20 138 30 Q120 40 100 30Z" fill="#f9c5d5" opacity="0.5" />
              <path d="M200 30 Q180 20 162 30 Q180 40 200 30Z" fill="#f9c5d5" opacity="0.5" />
              <path d="M80 30 Q95 25 108 30 Q95 35 80 30Z" fill="#f9c5d5" opacity="0.3" />
              <path d="M220 30 Q205 25 192 30 Q205 35 220 30Z" fill="#f9c5d5" opacity="0.3" />
              <circle cx="125" cy="22" r="3" fill="#f9c5d5" opacity="0.4" />
              <circle cx="175" cy="22" r="3" fill="#f9c5d5" opacity="0.4" />
              <circle cx="125" cy="38" r="3" fill="#f9c5d5" opacity="0.4" />
              <circle cx="175" cy="38" r="3" fill="#f9c5d5" opacity="0.4" />
              <line x1="60" y1="30" x2="88" y2="30" stroke="#f9c5d5" strokeWidth="0.5" opacity="0.4" />
              <line x1="212" y1="30" x2="240" y2="30" stroke="#f9c5d5" strokeWidth="0.5" opacity="0.4" />
            </g>
          </svg>
          <h1>Smut, Sass and Shadow Daddies</h1>
          <svg className="rose-deco rose-bottom" viewBox="0 0 300 80" xmlns="http://www.w3.org/2000/svg">
            <g opacity="0.6">
              <circle cx="150" cy="20" r="10" fill="none" stroke="#f9c5d5" strokeWidth="1" />
              <circle cx="150" cy="20" r="5" fill="#f9c5d5" opacity="0.5" />
              <path d="M130 20 Q138 12 148 20 Q138 28 130 20Z" fill="#f9c5d5" opacity="0.6" />
              <path d="M170 20 Q162 12 152 20 Q162 28 170 20Z" fill="#f9c5d5" opacity="0.6" />
              <path d="M150 0 Q158 8 150 18 Q142 8 150 0Z" fill="#f9c5d5" opacity="0.6" />
              <path d="M150 40 Q158 32 150 22 Q142 32 150 40Z" fill="#f9c5d5" opacity="0.4" />
              <circle cx="130" cy="40" r="4" fill="#f9c5d5" opacity="0.3" />
              <circle cx="170" cy="40" r="4" fill="#f9c5d5" opacity="0.3" />
              <path d="M100 55 Q125 45 148 50" fill="none" stroke="#f9c5d5" strokeWidth="0.8" opacity="0.4" />
              <path d="M152 50 Q175 45 200 55" fill="none" stroke="#f9c5d5" strokeWidth="0.8" opacity="0.4" />
              <circle cx="100" cy="55" r="3" fill="#f9c5d5" opacity="0.3" />
              <circle cx="200" cy="55" r="3" fill="#f9c5d5" opacity="0.3" />
            </g>
          </svg>
        </div>

        <p className="intro">
          Where FMCs make catastrophically questionable decisions — and we
          support them, because the MMC is tall, dark, broody, and absolutely
          not emotionally available ✨
        </p>

        <input
          placeholder="Club code"
          value={clubCode}
          onChange={(e) => setClubCode(e.target.value)}
        />

        <input
          placeholder="Your member name"
          value={memberName}
          onChange={(e) => setMemberName(e.target.value)}
        />

        <input
          placeholder="Admin code, optional"
          value={adminCode}
          onChange={(e) => setAdminCode(e.target.value)}
        />

        <p style={{ margin: "0.5rem 0 0.25rem", color: "#f9c5d5", fontFamily: "'Cinzel', serif", fontSize: "0.85rem", letterSpacing: "0.05em" }}>
          Choose your avatar
        </p>
        <div className="avatar-grid">
          {AVATARS.map((url) => (
            <button
              key={url}
              className={`avatar-btn ${avatar === url ? "selected" : ""}`}
              onClick={() => setAvatar(url)}
              type="button"
              style={{ padding: 0, background: "transparent", border: "none", width: "100%" }}
            >
              <img
                src={url}
                alt="avatar"
                className={`avatar-img ${avatar === url ? "selected" : ""}`}
              />
            </button>
          ))}
        </div>

        <button onClick={enterApp}>Enter the shadow realm</button>
      </div>
    );
  }

  return (
    <div className="app">

      <div className="title-wrap">
        <svg className="rose-deco" viewBox="0 0 300 60" xmlns="http://www.w3.org/2000/svg">
          <g opacity="0.7">
            <circle cx="150" cy="30" r="8" fill="none" stroke="#f9c5d5" strokeWidth="1" />
            <circle cx="150" cy="30" r="4" fill="#f9c5d5" opacity="0.6" />
            <path d="M100 30 Q120 20 138 30 Q120 40 100 30Z" fill="#f9c5d5" opacity="0.5" />
            <path d="M200 30 Q180 20 162 30 Q180 40 200 30Z" fill="#f9c5d5" opacity="0.5" />
            <path d="M80 30 Q95 25 108 30 Q95 35 80 30Z" fill="#f9c5d5" opacity="0.3" />
            <path d="M220 30 Q205 25 192 30 Q205 35 220 30Z" fill="#f9c5d5" opacity="0.3" />
            <circle cx="125" cy="22" r="3" fill="#f9c5d5" opacity="0.4" />
            <circle cx="175" cy="22" r="3" fill="#f9c5d5" opacity="0.4" />
            <circle cx="125" cy="38" r="3" fill="#f9c5d5" opacity="0.4" />
            <circle cx="175" cy="38" r="3" fill="#f9c5d5" opacity="0.4" />
            <line x1="60" y1="30" x2="88" y2="30" stroke="#f9c5d5" strokeWidth="0.5" opacity="0.4" />
            <line x1="212" y1="30" x2="240" y2="30" stroke="#f9c5d5" strokeWidth="0.5" opacity="0.4" />
          </g>
        </svg>
        <h1>Smut, Sass and Shadow Daddies</h1>
        <svg className="rose-deco rose-bottom" viewBox="0 0 300 80" xmlns="http://www.w3.org/2000/svg">
          <g opacity="0.6">
            <circle cx="150" cy="20" r="10" fill="none" stroke="#f9c5d5" strokeWidth="1" />
            <circle cx="150" cy="20" r="5" fill="#f9c5d5" opacity="0.5" />
            <path d="M130 20 Q138 12 148 20 Q138 28 130 20Z" fill="#f9c5d5" opacity="0.6" />
            <path d="M170 20 Q162 12 152 20 Q162 28 170 20Z" fill="#f9c5d5" opacity="0.6" />
            <path d="M150 0 Q158 8 150 18 Q142 8 150 0Z" fill="#f9c5d5" opacity="0.6" />
            <path d="M150 40 Q158 32 150 22 Q142 32 150 40Z" fill="#f9c5d5" opacity="0.4" />
            <circle cx="130" cy="40" r="4" fill="#f9c5d5" opacity="0.3" />
            <circle cx="170" cy="40" r="4" fill="#f9c5d5" opacity="0.3" />
            <path d="M100 55 Q125 45 148 50" fill="none" stroke="#f9c5d5" strokeWidth="0.8" opacity="0.4" />
            <path d="M152 50 Q175 45 200 55" fill="none" stroke="#f9c5d5" strokeWidth="0.8" opacity="0.4" />
            <circle cx="100" cy="55" r="3" fill="#f9c5d5" opacity="0.3" />
            <circle cx="200" cy="55" r="3" fill="#f9c5d5" opacity="0.3" />
          </g>
        </svg>
      </div>

      <button className="logout-btn" onClick={logout}>✦ logout</button>

      <p className="intro">Welcome back, {memberName} ✨</p>

      {page === "home" && (
        <section className="card">
          <h2>Next Meeting</h2>
          {meetings[0] ? (
            <div className="meeting-card">
              <img
                src={getBookCover(meetings[0].book_title)}
                alt={meetings[0].book_title}
                className="meeting-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://dummyimage.com/300x200/1a1a2e/f9c5d5.png&text=${encodeURIComponent(meetings[0].book_title)}`
                }}
              />
              <div className="meeting-info">
                <p className="meeting-label">✦ Currently Reading</p>
                <h3 style={{ fontFamily: "'Pinyon Script', cursive", fontSize: "2rem", color: "white", margin: "0.25rem 0" }}>
                  {meetings[0].book_title}
                </h3>
                <p className="meeting-author">by {meetings[0].author}</p>
                <div className="meeting-date-row">
                  <span className="meeting-pill">📅 {meetings[0].meeting_date}</span>
                  <span className="meeting-pill">🕯️ {meetings[0].meeting_time}</span>
                </div>
                <div className="attendance-section">
                  <p className="meeting-label">✦ Who's coming</p>
                  <div className="attendees-row">
                    {attendeesForMeeting(meetings[0].id).length === 0 && (
                      <p className="small">No one yet — be the first!</p>
                    )}
                    {attendeesForMeeting(meetings[0].id).slice(0, 3).map(a => (
                      <span key={a.id} className="attendee-tag">
                        <img
                          src={membersMap[a.member_name] || AVATARS[0]}
                          alt={a.member_name}
                          className="avatar-tiny"
                        />
                        <span className="attendee-name">{a.member_name}</span>
                      </span>
                    ))}
                    {attendeesForMeeting(meetings[0].id).length > 3 && (
                      <div className="attendees-overflow">
                        <span className="overflow-count">
                          +{attendeesForMeeting(meetings[0].id).length - 3}
                        </span>
                        <div className="overflow-tooltip">
                          {attendeesForMeeting(meetings[0].id).slice(3).map(a => (
                            <span key={a.id} className="overflow-member">
                              <img
                                src={membersMap[a.member_name] || AVATARS[0]}
                                alt={a.member_name}
                                className="avatar-tiny"
                              />
                              <span>{a.member_name}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    style={{ marginLeft: "0", width: "75%" }}
                    className={isAttending(meetings[0].id) ? "secondary" : ""}
                    onClick={() => toggleAttendance(meetings[0].id)}
                  >
                    {isAttending(meetings[0].id) ? "✦ I can't make it" : "✦ I'm attending!"}
                  </button>
                </div>
                <button onClick={() => { setPage("community"); setCommunityPage("notes"); }}>
                  Open Notes
                </button>
              </div>
            </div>
          ) : (
            <p className="small">No upcoming meeting yet.</p>
          )}
          <div className="share-wrap">
            <button className="share-trigger" onClick={() => setShowShare(!showShare)}>
              🔗 Share this app
            </button>
            {showShare && (
              <div className="share-bubble">
                <p className="share-label">Copy the link</p>
                <div className="share-row">
                  <span className="share-url">{window.location.href}</span>
                  <button className="copy-btn" onClick={copyLink}>
                    {copied ? "✓ Copied!" : "Copy"}
                  </button>
                </div>
                <button className="whatsapp" onClick={shareWhatsApp}>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="white" style={{ marginRight: "0.5rem", flexShrink: 0 }}>
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Share via WhatsApp
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {page === "library" && (
        <section className="card">
          <h2>Library</h2>

          <div className="tabs">
            <button
              className={`tab-btn ${libraryPage === "suggestions" ? "tab-active" : ""}`}
              onClick={() => setLibraryPage("suggestions")}
            >
              📖 Book Suggestions
            </button>
            <button
              className={`tab-btn ${libraryPage === "archive" ? "tab-active" : ""}`}
              onClick={() => setLibraryPage("archive")}
            >
              🏛️ Archive
            </button>
          </div>

          {libraryPage === "suggestions" && (
            <>
              {meetings[0] && (
                <div className="item">
                  <h3>Current Book</h3>
                  <strong>{meetings[0].book_title}</strong>
                  <p>by {meetings[0].author}</p>
                </div>
              )}

              <div className="item">
                <h3>Top 3 Favourites in the Current Vote</h3>
                {topThreeBooks().length === 0 && (
                  <p className="small">No votes yet.</p>
                )}
                {topThreeBooks().map((b, index) => (
                  <p key={b.id}>
                    {index + 1}. {b.title} — {voteCount(b.id)} votes
                  </p>
                ))}
              </div>

              <h3>Suggest a Book</h3>

              <input
                placeholder="Book title"
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
              />

              <input
                placeholder="Author"
                value={bookAuthor}
                onChange={(e) => setBookAuthor(e.target.value)}
              />

              <textarea
                placeholder="Why should the book club read it?"
                value={whyRead}
                onChange={(e) => setWhyRead(e.target.value)}
              />

              <button onClick={addBook}>Add book suggestion</button>

              <h3>Current Suggestions</h3>

              {books.map((b) => (
                <div className="item" key={b.id}>
                  <img
                    src={getBookCover(b.title)}
                    alt={b.title}
                    className="cover-top"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://dummyimage.com/300x200/1a1a2e/f9c5d5.png&text=${encodeURIComponent(b.title)}`
                    }}
                  />
                  <div className="archive-header" style={{ marginTop: "0.75rem" }}>
                    <div>
                      <strong>{b.title}</strong>
                      <p>by {b.author}</p>
                    </div>
                    <span className="vote-count">{voteCount(b.id)} ♥</span>
                  </div>

                  <p className="small">{b.why_read}</p>

                  <span className="member-tag" style={{ marginTop: "0.5rem" }}>
                    <img
                      src={membersMap[b.suggested_by] || AVATARS[0]}
                      alt={b.suggested_by}
                      className="avatar-tiny"
                    />
                    <small style={{ color: "rgba(249,197,213,0.6)", fontFamily: "'Cinzel', serif", fontSize: "0.7rem", letterSpacing: "0.05em" }}>
                      Suggested by {b.suggested_by}
                    </small>
                  </span>

                  <div className="book-actions">
                    <button
                      className={userVoted(b.id) ? "secondary" : ""}
                      onClick={() => vote(b.id)}
                    >
                      {userVoted(b.id) ? "♥ Remove vote" : "♡ Vote"}
                    </button>
                    {isAdmin && (
                      <button className="secondary" onClick={() => selectAsNextBook(b)}>
                        Select as next book
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}

          {libraryPage === "archive" && (
            <>
              <h3>Archive</h3>

              {archiveMeetings.map((m) => (
                <div className="item" key={m.id}>
                  <img
                    src={getBookCover(m.book_title)}
                    alt={m.book_title}
                    className="cover-top"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://dummyimage.com/300x200/1a1a2e/f9c5d5.png&text=${encodeURIComponent(m.book_title)}`
                    }}
                  />
                  <div className="archive-header" style={{ marginTop: "0.75rem" }}>
                    <div>
                      <strong>{m.book_title}</strong>
                      <p>by {m.author}</p>
                      <p className="small">{m.meeting_date}</p>
                    </div>
                    <button className="discussion-btn" onClick={() => setSelectedArchive(m)}>
                      💬 Discussion
                    </button>
                  </div>
                  <p className="small">Average rating: {averageRating(m.id)}</p>
                  <div className="star-section">
                    <p className="star-label">Rate this book:</p>
                    <div className="star-row">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} className="star-btn" onClick={() => rateBook(m.id, star)}>
                          {myRating(m.id)?.rating >= star ? "★" : "☆"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </section>
      )}

      {page === "community" && (
        <section className="card">
          <h2>Community</h2>

          <div className="tabs">
            <button
              className={`tab-btn ${communityPage === "notes" ? "tab-active" : ""}`}
              onClick={() => setCommunityPage("notes")}
            >
              📝 Notes
            </button>
            <button
              className={`tab-btn ${communityPage === "ideas" ? "tab-active" : ""}`}
              onClick={() => setCommunityPage("ideas")}
            >
              💡 Ideas & Feedback
            </button>
            {isAdmin && (
              <button
                className={`tab-btn ${communityPage === "admin" ? "tab-active" : ""}`}
                onClick={() => setCommunityPage("admin")}
              >
                ⚙️ Admin
              </button>
            )}
          </div>

          <div className="tabs tabs-community"></div>

          {communityPage === "notes" && (
            <>
              <h3>Current Read Notes</h3>

              {meetings[0] && (
                <p className="small">
                  Current read: {meetings[0].book_title} by {meetings[0].author}
                </p>
              )}

              <p className="small">
                {notesUnlocked()
                  ? "✨ Book club notes unlocked. Everyone can now see all notes."
                  : "Your notes are private until 24 hours before the meeting."}
              </p>

              <select value={noteType} onChange={(e) => setNoteType(e.target.value)}>
                <option>Question</option>
                <option>Theory</option>
                <option>Favourite Moment</option>
                <option>Other</option>
              </select>

              <textarea
                placeholder="Write your chaotic thoughts..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />

              <button onClick={addNote}>Add note</button>

              <h3>Meeting Pack</h3>

              {Object.entries(groupedNotes(visibleNotesForCurrentMeeting())).map(
                ([type, items]) => (
                  <div key={type}>
                    <h4 className="category-title">{type}</h4>
                    {items.length === 0 && <p className="small">No notes yet.</p>}
                    {items.map((n) => (
                      <div className="item" key={n.id}>
                        <span className="member-tag">
                          <img
                            src={membersMap[n.member_name] || AVATARS[0]}
                            alt={n.member_name}
                            className="avatar-tiny"
                          />
                          <strong>{n.member_name}</strong>
                        </span>
                        <p>{n.note_text}</p>
                      </div>
                    ))}
                  </div>
                )
              )}
            </>
          )}

          {communityPage === "ideas" && (
            <>
              <h3>Ideas & Feedback</h3>

              <select
                value={feedbackType}
                onChange={(e) => setFeedbackType(e.target.value)}
              >
                <option>App idea</option>
                <option>Book club idea</option>
              </select>

              <textarea
                placeholder="Share your idea or feedback..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
              />

              <button onClick={addFeedback}>Submit feedback</button>

              {isAdmin && (
                <>
                  <h3>Admin View: Submitted Ideas</h3>
                  {feedback.map((f) => (
                    <div className="item" key={f.id}>
                      <strong>{f.feedback_type}</strong>
                      <p>{f.feedback_text}</p>
                      <span className="member-tag">
                        <img
                          src={membersMap[f.member_name] || AVATARS[0]}
                          alt={f.member_name}
                          className="avatar-tiny"
                        />
                        <small>From {f.member_name}</small>
                      </span>
                    </div>
                  ))}
                </>
              )}
            </>
          )}

          {communityPage === "admin" && isAdmin && (
            <>
              <h3>Admin</h3>

              <input
                type="date"
                value={newMeetingDate}
                onChange={(e) => setNewMeetingDate(e.target.value)}
              />

              <input
                type="time"
                value={newMeetingTime}
                onChange={(e) => setNewMeetingTime(e.target.value)}
              />

              <input
                placeholder="Book title"
                value={newMeetingBook}
                onChange={(e) => setNewMeetingBook(e.target.value)}
              />

              <input
                placeholder="Author"
                value={newMeetingAuthor}
                onChange={(e) => setNewMeetingAuthor(e.target.value)}
              />

              <button onClick={addMeeting}>Add meeting</button>
            </>
          )}
        </section>
      )}

      {selectedArchive && (
        <div className="modal">
          <div className="modal-content">
            <button onClick={() => setSelectedArchive(null)}>Close</button>

            <h2>{selectedArchive.book_title}</h2>
            <div className="modal-meta">
              <p>by {selectedArchive.author}</p>
              <p>✦</p>
              <p>{selectedArchive.meeting_date}</p>
            </div>

            <h3>Ratings</h3>
            {ratingsForMeeting(selectedArchive.id).length === 0 && (
              <p className="small">No ratings yet.</p>
            )}
            <div className="ratings-list">
              {ratingsForMeeting(selectedArchive.id).map((r) => (
                <div key={r.id} className="item">
                  <span className="member-tag">
                    <img
                      src={membersMap[r.member_name] || AVATARS[0]}
                      alt={r.member_name}
                      className="avatar-tiny"
                    />
                    <strong>{r.member_name}</strong>
                    <span className="rating-tag">{r.rating} ★</span>
                  </span>
                </div>
              ))}
            </div>

            <h3>Notes</h3>
            {Object.entries(groupedNotes(notesForMeeting(selectedArchive.id))).map(
              ([type, items]) => (
                <div key={type}>
                  <h4 className="category-title">{type}</h4>
                  {items.length === 0 && <p className="small">No notes yet.</p>}
                  {items.map((n) => (
                    <div className="item" key={n.id}>
                      <span className="member-tag">
                        <img
                          src={membersMap[n.member_name] || AVATARS[0]}
                          alt={n.member_name}
                          className="avatar-tiny"
                        />
                        <strong>{n.member_name}</strong>
                      </span>
                      <p>{n.note_text}</p>
                    </div>
                  ))}
                </div>
              )
            )}

            <h3>More Books Like This</h3>

            {similarForMeeting(selectedArchive.id).map((b) => (
              <div className="item" key={b.id}>
                <img
                  src={getBookCover(b.title)}
                  alt={b.title}
                  className="cover-top"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://dummyimage.com/300x200/1a1a2e/f9c5d5.png&text=${encodeURIComponent(b.title)}`
                  }}
                />
                <div style={{ marginTop: "0.75rem" }}>
                  <strong>{b.title}</strong>
                  <p>by {b.author}</p>
                  <span className="member-tag" style={{ marginTop: "0.5rem" }}>
                    <img
                      src={membersMap[b.recommended_by] || AVATARS[0]}
                      alt={b.recommended_by}
                      className="avatar-tiny"
                    />
                    <small style={{ color: "rgba(249,197,213,0.6)", fontFamily: "'Cinzel', serif", fontSize: "0.7rem", letterSpacing: "0.05em" }}>
                      Recommended by {b.recommended_by}: {b.reason}
                    </small>
                  </span>
                </div>
              </div>
            ))}

            <input
              placeholder="Book title"
              value={similarTitle}
              onChange={(e) => setSimilarTitle(e.target.value)}
            />

            <input
              placeholder="Author"
              value={similarAuthor}
              onChange={(e) => setSimilarAuthor(e.target.value)}
            />

            <textarea
              placeholder="Why does this remind you of this book?"
              value={similarReason}
              onChange={(e) => setSimilarReason(e.target.value)}
            />

            <button onClick={() => addSimilarBook(selectedArchive.id)}>
              Add similar book
            </button>
          </div>
        </div>
      )}

      <div className="topnav">
        <button
          className={`navbtn ${page === "home" ? "active" : ""}`}
          onClick={() => {
            setPage("home");
            setSelectedArchive(null);
            setLibraryPage("suggestions");
          }}
        >
          <span className="nav-icon">🏰</span>
          <span className="nav-label">Home</span>
        </button>
        <button
          className={`navbtn ${page === "library" ? "active" : ""}`}
          onClick={() => {
            setPage("library");
            setSelectedArchive(null);
          }}
        >
          <span className="nav-icon">📚</span>
          <span className="nav-label">Library</span>
        </button>
        <button
          className={`navbtn ${page === "community" ? "active" : ""}`}
          onClick={() => {
            setPage("community");
            setSelectedArchive(null);
          }}
        >
          <span className="nav-icon">🌙</span>
          <span className="nav-label">Community</span>
        </button>
      </div>
    </div>
  );
}
