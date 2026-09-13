import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { createWorkflow, getConsultants, type WorkflowResult } from "./api";
import type {
  ConsultantProfile,
  Inquiry,
  WorkflowDraft,
} from "../shared/contracts";
import "./styles.css";

type InquiryFormValues = Pick<
  Inquiry,
  "clientName" | "company" | "challenge" | "desiredOutcome"
>;

const emptyInquiry: InquiryFormValues = {
  clientName: "",
  company: "",
  challenge: "",
  desiredOutcome: "",
};

function formatDueDate(dueInDays: number): string {
  if (dueInDays === 0) {
    return "Today";
  }

  if (dueInDays === 1) {
    return "Tomorrow";
  }

  return `In ${dueInDays} days`;
}

function BulletList({ items }: { readonly items: readonly string[] }) {
  return (
    <ul className="bullet-list">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function BriefColumn({
  label,
  items,
}: {
  readonly label: string;
  readonly items: readonly string[];
}) {
  return (
    <div className="brief-column">
      <h4>{label}</h4>
      <BulletList items={items} />
    </div>
  );
}

function WorkflowResults({
  draft,
  completedTasks,
  onToggleTask,
}: {
  readonly draft: WorkflowDraft;
  readonly completedTasks: ReadonlySet<number>;
  readonly onToggleTask: (taskIndex: number) => void;
}) {
  return (
    <div className="results" aria-live="polite">
      <section className="result-section" aria-labelledby="discovery-heading">
        <div className="section-marker">01 / Signal</div>
        <h3 id="discovery-heading">Discovery brief</h3>
        <p className="result-lede">{draft.discoveryBrief.summary}</p>
        <div className="brief-grid">
          <BriefColumn label="Goals" items={draft.discoveryBrief.goals} />
          <BriefColumn label="Constraints" items={draft.discoveryBrief.constraints} />
          <BriefColumn label="Open questions" items={draft.discoveryBrief.openQuestions} />
        </div>
      </section>

      <section className="result-section" aria-labelledby="proposal-heading">
        <div className="section-marker">02 / Shape</div>
        <h3 id="proposal-heading">Proposal</h3>
        <div className="proposal-copy">
          <h4>{draft.proposal.title}</h4>
          <p>{draft.proposal.summary}</p>
          <dl className="proposal-facts">
            <div>
              <dt>Scope</dt>
              <dd>{draft.proposal.scope}</dd>
            </div>
            <div>
              <dt>Timeline</dt>
              <dd>{draft.proposal.timeline}</dd>
            </div>
          </dl>
          <div className="deliverables">
            <h4>Deliverables</h4>
            <BulletList items={draft.proposal.deliverables} />
          </div>
        </div>
      </section>

      <section className="result-section" aria-labelledby="tasks-heading">
        <div className="section-marker">03 / Handoff</div>
        <h3 id="tasks-heading">Follow-up tasks</h3>
        <p className="section-note">Keep momentum without leaving this draft.</p>
        <div className="task-list">
          {draft.followUpTasks.map((task, index) => (
            <label className={`task-row${completedTasks.has(index) ? " is-complete" : ""}`} key={`${task.title}-${index}`}>
              <input
                type="checkbox"
                checked={completedTasks.has(index)}
                onChange={() => onToggleTask(index)}
              />
              <span className="task-copy">
                <strong>{task.title}</strong>
                <span>
                  {task.owner === "consultant" ? "Consultant" : "Client"} / {formatDueDate(task.dueInDays)}
                </span>
                <small>{task.rationale}</small>
              </span>
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}

export function App() {
  const [consultants, setConsultants] = useState<readonly ConsultantProfile[]>([]);
  const [selectedConsultantId, setSelectedConsultantId] = useState("");
  const [inquiry, setInquiry] = useState<InquiryFormValues>(emptyInquiry);
  const [workflow, setWorkflow] = useState<WorkflowResult | null>(null);
  const [completedTasks, setCompletedTasks] = useState<ReadonlySet<number>>(
    () => new Set(),
  );
  const [isLoadingConsultants, setIsLoadingConsultants] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consultantError, setConsultantError] = useState(false);
  const [workflowError, setWorkflowError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getConsultants()
      .then((loadedConsultants) => {
        if (!isMounted) {
          return;
        }

        setConsultants(loadedConsultants);
        setSelectedConsultantId(loadedConsultants[0]?.id ?? "");
        setIsLoadingConsultants(false);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setConsultantError(true);
        setIsLoadingConsultants(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  function handleInputChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.currentTarget;
    setInquiry((currentInquiry) => ({
      ...currentInquiry,
      [name]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedConsultantId || isSubmitting) {
      return;
    }

    const submittedInquiry: Inquiry = {
      consultantId: selectedConsultantId,
      ...inquiry,
    };

    setIsSubmitting(true);
    setWorkflow(null);
    setWorkflowError(false);
    setCompletedTasks(new Set());

    try {
      const result = await createWorkflow(submittedInquiry);
      setWorkflow(result);
    } catch {
      setWorkflowError(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  function toggleTask(taskIndex: number) {
    setCompletedTasks((currentTasks) => {
      const nextTasks = new Set(currentTasks);
      if (nextTasks.has(taskIndex)) {
        nextTasks.delete(taskIndex);
      } else {
        nextTasks.add(taskIndex);
      }
      return nextTasks;
    });
  }

  const isFormDisabled = isLoadingConsultants || isSubmitting || consultantError;

  return (
    <main className="app-shell">
      <header className="site-header">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">SP</div>
          <div>
            <p className="eyebrow">ScopePilot / Consultant cockpit</p>
            <h1>ScopePilot</h1>
          </div>
        </div>
        <p className="header-note">From first signal to a focused next move.</p>
      </header>

      <section className="intro" aria-labelledby="intro-heading">
        <div>
          <p className="eyebrow accent-label">A better handoff starts here</p>
          <h2 id="intro-heading">Turn a client conversation into work you can move.</h2>
        </div>
        <p className="intro-copy">
          Choose your point of view, add the shape of the challenge, and leave with a
          discovery brief, proposal draft, and next steps in one pass.
        </p>
      </section>

      <div className="flow-legend" aria-label="Workflow steps">
        <span><b>01</b> Intake</span>
        <span><b>02</b> Handoff</span>
        <span className="legend-note">Synthetic workspace</span>
      </div>

      <div className="cockpit-grid">
        <section className="intake-panel" aria-labelledby="intake-heading">
          <div className="section-marker">01 / Intake</div>
          <h2 id="intake-heading">Set the brief in motion.</h2>
          <p className="panel-intro">Give the consultant enough signal to make the next conversation useful.</p>

          {consultantError && (
            <p className="error-message" role="alert">
              We couldn't load consultant profiles. Refresh and try again.
            </p>
          )}

          <form className="inquiry-form" onSubmit={handleSubmit}>
            <fieldset disabled={isFormDisabled}>
              <legend>Choose a consultant</legend>
              <div className="consultant-options">
                {isLoadingConsultants ? (
                  <p className="loading-copy">Loading consultant profiles...</p>
                ) : (
                  consultants.map((consultant) => (
                    <label className="consultant-option" key={consultant.id}>
                      <input
                        type="radio"
                        name="consultantId"
                        value={consultant.id}
                        checked={selectedConsultantId === consultant.id}
                        onChange={() => setSelectedConsultantId(consultant.id)}
                      />
                      <span className="consultant-copy">
                        <strong>{consultant.displayName}</strong>
                        <span>{consultant.specialties.join(" / ")}</span>
                        <small>{consultant.services.join(" / ")}</small>
                      </span>
                    </label>
                  ))
                )}
              </div>
            </fieldset>

            <div className="form-grid">
              <label className="field">
                <span>Client name</span>
                <input
                  name="clientName"
                  value={inquiry.clientName}
                  onChange={handleInputChange}
                  minLength={2}
                  maxLength={120}
                  required
                />
              </label>
              <label className="field">
                <span>Company</span>
                <input
                  name="company"
                  value={inquiry.company}
                  onChange={handleInputChange}
                  minLength={2}
                  maxLength={160}
                  required
                />
              </label>
              <label className="field field-wide">
                <span>What challenge are you trying to solve?</span>
                <textarea
                  name="challenge"
                  value={inquiry.challenge}
                  onChange={handleInputChange}
                  minLength={10}
                  maxLength={2_000}
                  rows={5}
                  required
                />
              </label>
              <label className="field field-wide">
                <span>What outcome would make this useful?</span>
                <textarea
                  name="desiredOutcome"
                  value={inquiry.desiredOutcome}
                  onChange={handleInputChange}
                  minLength={10}
                  maxLength={2_000}
                  rows={5}
                  required
                />
              </label>
            </div>

            <button className="primary-action" type="submit" disabled={isFormDisabled}>
              <span>{isSubmitting ? "Building workflow..." : "Build workflow"}</span>
              <span aria-hidden="true">-&gt;</span>
            </button>
          </form>
        </section>

        <section className="output-panel" aria-labelledby="output-heading">
          <div className="section-marker">02 / Handoff</div>
          <div className="output-heading-row">
            <div>
              <h2 id="output-heading">Your working draft.</h2>
              <p className="panel-intro">The useful parts, ready to discuss and refine.</p>
            </div>
            {workflow && <span className="draft-status">Draft ready</span>}
          </div>

          {isSubmitting && (
            <p className="workflow-status" role="status">
              Building your workflow...
            </p>
          )}

          {workflowError && (
            <p className="error-message" role="alert">
              We couldn't build that workflow. Check the details and try again.
            </p>
          )}

          {!workflow && !isSubmitting && !workflowError && (
            <div className="empty-output">
              <span className="empty-number">00</span>
              <p>Your generated work will land here.</p>
              <small>Start with the intake on the left.</small>
            </div>
          )}

          {workflow && (
            <WorkflowResults
              draft={workflow.draft}
              completedTasks={completedTasks}
              onToggleTask={toggleTask}
            />
          )}
        </section>
      </div>
    </main>
  );
}
