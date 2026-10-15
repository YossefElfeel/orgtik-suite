import React, { useRef, useState } from "react";
import { sendIdeaComment } from "../content/forms";
import { communityText, submissionError } from "../content/roadmap-community";
import { toSiteHref } from "./navigation";
import "./idea-discussion.css";

export function IdeaDiscussion({ ideaId, comments }) {
  const text = communityText();
  const [fields, setFields] = useState({
    name: "",
    email: "",
    message: "",
    consent: false,
  });
  const [sending, setSending] = useState(false),
    [received, setReceived] = useState(false),
    [error, setError] = useState("");
  const request = useRef(),
    busy = useRef(false);
  const real = comments.filter((comment) => !comment.sample),
    samples = comments.filter((comment) => comment.sample);
  const thread = (rows) => (
    <ol className="idea-discussion-list">
      {rows.map((comment) => (
        <li key={comment.id} data-idea-comment={comment.id}>
          <p className="idea-discussion-author" dir="auto">
            {comment.author}
          </p>
          <p dir="auto">{comment.body}</p>
        </li>
      ))}
    </ol>
  );
  const submit = async (event) => {
    event.preventDefault();
    if (busy.current) return;
    const payload = JSON.stringify(fields);
    if (request.current?.payload !== payload)
      request.current = { payload, id: crypto.randomUUID() };
    busy.current = true;
    setSending(true);
    setError("");
    try {
      await sendIdeaComment(ideaId, fields, request.current.id);
      setReceived(true);
      setFields({ name: "", email: "", message: "", consent: false });
    } catch (error) {
      setError(submissionError(error));
    } finally {
      busy.current = false;
      setSending(false);
    }
  };
  return (
    <section
      className="idea-discussion"
      aria-labelledby="rm-comments-title"
      data-idea-comments=""
    >
      <h3 id="rm-comments-title">{text.comments}</h3>
      {real.length ? (
        thread(real)
      ) : (
        <p className="idea-discussion-note">{text.empty}</p>
      )}
      {samples.length ? (
        <details className="idea-discussion-samples">
          <summary>
            {text.sample} ({samples.length})
          </summary>
          <p className="idea-discussion-note">{text.sampleNote}</p>
          {thread(samples)}
        </details>
      ) : null}
      {received ? (
        <div role="status" className="idea-discussion-received">
          <p>{text.received}</p>
          <button
            type="button"
            className="idea-discussion-secondary"
            onClick={() => {
              request.current = undefined;
              setReceived(false);
            }}
          >
            {text.another}
          </button>
        </div>
      ) : (
        <form onSubmit={submit} aria-label={text.submit}>
          <fieldset disabled={sending}>
            <div className="idea-discussion-contact">
              {["name", "email"].map((key) => (
                <label key={key}>
                  {text[key]}
                  <input
                    name={key}
                    type={key === "email" ? "email" : "text"}
                    autoComplete={key}
                    maxLength={key === "email" ? 254 : 100}
                    required
                    value={fields[key]}
                    onChange={(event) =>
                      setFields((previous) => ({
                        ...previous,
                        [key]: event.target.value,
                      }))
                    }
                  />
                </label>
              ))}
            </div>
            <label>
              {text.message}
              <textarea
                name="message"
                rows={4}
                maxLength={5000}
                required
                value={fields.message}
                onChange={(event) =>
                  setFields((previous) => ({
                    ...previous,
                    message: event.target.value,
                  }))
                }
              />
            </label>
            <label className="idea-discussion-consent">
              <input
                type="checkbox"
                name="consent"
                required
                checked={fields.consent}
                onChange={(event) =>
                  setFields((previous) => ({
                    ...previous,
                    consent: event.target.checked,
                  }))
                }
              />
              <span>
                {text.commentConsent}{" "}
                <a
                  href={toSiteHref("/legal/privacy")}
                  target="_blank"
                  rel="noreferrer"
                >
                  {text.privacy}
                </a>
                .
              </span>
            </label>
            {error ? (
              <p role="alert" className="idea-discussion-error">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              className="idea-discussion-submit"
              aria-busy={sending}
            >
              {sending ? text.sending : text.submit}
              <i aria-hidden="true" className="ph ph-arrow-up-right" />
            </button>
          </fieldset>
        </form>
      )}
    </section>
  );
}
