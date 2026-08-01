import { useAuth } from "../AuthContext.jsx";

export default function Education() {
  const { user } = useAuth();
  const isMom = user?.role === "mom";

  return (
    <div>
      <div className="page-header">
        <h2>Understanding Postpartum Depression</h2>
        <p>{isMom ? "A short guide to what you might be going through, and what can help." : "A short guide to what she might be going through, and how to actually help."}</p>
      </div>

      <div className="card edu-section">
        <h3>What it is</h3>
        <p>
          Postpartum depression (PPD) is a real, common mood condition that can develop in the weeks or months after
          childbirth. It's different from the short-lived "baby blues" -- those usually fade within two weeks. PPD
          can last longer and affect {isMom ? "your" : "a mother's"} ability to function, bond with the baby, and take care of {isMom ? "yourself" : "herself"}.
          It is not caused by anything {isMom ? "you" : "she"} did wrong, and it is not a reflection of how much {isMom ? "you love" : "she loves"} the baby.
        </p>
      </div>

      <div className="card edu-section">
        <h3>Common signs to watch for</h3>
        <ul>
          <li>Persistent sadness, emptiness, or crying that doesn't seem tied to anything specific</li>
          <li>Loss of interest in things {isMom ? "you" : "she"} used to enjoy</li>
          <li>Withdrawing from family, friends, or the baby</li>
          <li>Trouble sleeping even when the baby is asleep, or sleeping far more than usual</li>
          <li>Feeling like a "bad mother," excessive guilt, or feeling worthless</li>
          <li>Difficulty concentrating or making decisions</li>
          <li>Loss of appetite, or eating much more than usual</li>
          <li>In severe cases, thoughts of harming {isMom ? "yourself" : "herself"} or the baby -- this needs urgent professional help</li>
        </ul>
      </div>

      <div className="card edu-section">
        <h3>Myths vs. facts</h3>
        <div className="myth-fact-row">
          <div className="myth-box"><span className="label">Myth</span>{isMom ? "You" : "She"} just need{isMom ? "" : "s"} to try harder / snap out of it.</div>
          <div className="fact-box"><span className="label">Fact</span>PPD is a medical condition, not a lack of effort or willpower.</div>
        </div>
        <div className="myth-fact-row">
          <div className="myth-box"><span className="label">Myth</span>Only "weak" mothers get PPD.</div>
          <div className="fact-box"><span className="label">Fact</span>It affects roughly 1 in 7 mothers, regardless of strength or personality.</div>
        </div>
        <div className="myth-fact-row">
          <div className="myth-box"><span className="label">Myth</span>If {isMom ? "you don't" : "she doesn't"} mention it, {isMom ? "you're" : "she's"} fine.</div>
          <div className="fact-box"><span className="label">Fact</span>Many mothers hide symptoms out of guilt, fear of judgment, or fear of losing custody.</div>
        </div>
        <div className="myth-fact-row">
          <div className="myth-box"><span className="label">Myth</span>It always starts right after birth.</div>
          <div className="fact-box"><span className="label">Fact</span>It can develop anytime in the first year postpartum.</div>
        </div>
      </div>

      {isMom ? (
        <div className="card edu-section">
          <h3>What can actually help</h3>
          <ul>
            <li><strong>Say it out loud to someone you trust.</strong> Naming it takes away some of its power, and it's the first step toward support.</li>
            <li><strong>Accept specific help when it's offered</strong> -- someone holding the baby so you can rest is not a failure on your part.</li>
            <li><strong>Talk to a doctor if it's lasted more than two weeks</strong> or feels severe. Screening tools like the one in this app are a starting point, not a diagnosis -- a professional can properly assess and help.</li>
            <li><strong>Be honest with your care team</strong>, including about dark thoughts if they come up. That's a sign you need immediate support, not a reason to feel ashamed.</li>
            <li><strong>Rest counts as progress</strong>, even on days that don't look productive.</li>
          </ul>
        </div>
      ) : (
        <div className="card edu-section">
          <h3>How you can actually help</h3>
          <ul>
            <li><strong>Offer specific help, not open-ended offers.</strong> "I'll take the baby from 2-4pm so you can nap" beats "let me know if you need anything."</li>
            <li><strong>Listen without trying to fix it immediately.</strong> Sometimes she needs to be heard, not solved.</li>
            <li><strong>Avoid judgment or comparison.</strong> "I never felt this way with my kids" isn't helpful, even if well-intentioned.</li>
            <li><strong>Gently encourage professional support</strong> if symptoms last more than two weeks or feel severe -- a doctor, midwife, or therapist can properly assess and help.</li>
            <li><strong>Take her seriously</strong> if she mentions dark thoughts. That's not attention-seeking -- it's a sign she needs immediate help.</li>
            <li><strong>Check in on the ordinary days too</strong>, not just when things look bad. Consistency matters.</li>
          </ul>
        </div>
      )}

      <div className="card edu-section">
        <h3>When to seek urgent help</h3>
        <p>
          {isMom
            ? "If you're having thoughts of harming yourself or the baby, or feel like you have no will to go on, that's an emergency -- not something to wait out. Please contact a helpline or emergency services immediately, and reach out to someone who can be with you."
            : "If she talks about harming herself or the baby, or expresses no will to go on, that's an emergency -- not something to wait out. Contact a mental health helpline or emergency services immediately, and stay with her if you safely can."}
        </p>
      </div>
    </div>
  );
}