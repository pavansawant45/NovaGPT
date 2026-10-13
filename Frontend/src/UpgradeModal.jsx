function UpgradeModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <div className="modalOverlay" onClick={onClose}>
            <div className="modalContent upgradeModal" onClick={(e) => e.stopPropagation()}>

                {/* Gradient header */}
                <div className="upgradeHeader">
                    <button className="closeBtn upgradeCloseBtn" onClick={onClose}>&times;</button>
                    <div className="upgradeHeroIcon">
                        <i className="fa-solid fa-bolt"></i>
                    </div>
                    <h2 className="upgradeTitle">Upgrade to NovaGPT Plus</h2>
                    <p className="upgradeSubtitle">Unlock the full power of Nova</p>
                </div>

                {/* Plans */}
                <div className="upgradePlans">

                    {/* Free Plan */}
                    <div className="planCard" id="free-plan-card">
                        <div className="planCardHeader">
                            <div className="planName">Free</div>
                            <div className="planPrice">$0 <span className="planPeriod">/ month</span></div>
                        </div>
                        <ul className="planFeatures">
                            <li><i className="fa-solid fa-check planCheck"></i> Standard response speed</li>
                            <li><i className="fa-solid fa-check planCheck"></i> Llama 3.3 70B access</li>
                            <li><i className="fa-solid fa-check planCheck"></i> Speech recognition</li>
                            <li><i className="fa-solid fa-check planCheck"></i> Chat history sync</li>
                        </ul>
                        <div className="planCurrentBadge">Current Plan</div>
                    </div>

                    {/* Plus Plan */}
                    <div className="planCard planCardPro" id="plus-plan-card">
                        <div className="planPopularBadge">
                            <i className="fa-solid fa-star"></i> Popular
                        </div>
                        <div className="planCardHeader">
                            <div className="planName planNamePro">Plus</div>
                            <div className="planPrice planPricePro">$20 <span className="planPeriod">/ month</span></div>
                        </div>
                        <ul className="planFeatures">
                            <li><i className="fa-solid fa-bolt planCheckPro"></i> Ultra-fast Llama 3.3 Turbo</li>
                            <li><i className="fa-solid fa-bolt planCheckPro"></i> Priority server access</li>
                            <li><i className="fa-solid fa-bolt planCheckPro"></i> Unlimited multi-turn chats</li>
                            <li><i className="fa-solid fa-bolt planCheckPro"></i> Custom assistant personas</li>
                        </ul>
                        <button
                            className="upgradeNowBtn"
                            id="upgrade-now-btn"
                            onClick={() => alert("Subscription upgraded! (Demo mock)")}
                        >
                            <i className="fa-solid fa-bolt"></i>
                            Upgrade Now
                        </button>
                    </div>

                </div>

                <p className="upgradeDisclaimer">Cancel anytime. Billed monthly. No hidden fees.</p>
            </div>
        </div>
    );
}

export default UpgradeModal;
