const API_KEY = "d8rl8t1r01qnkitod980d8rl8t1r01qnkitod98g";
const holdings = [
    {symbol:"TQQQ",shares:630,cost:28.01,group:"Leveraged"},
    {symbol:"NVDA",shares:318,cost:69.99,group:"AI"},
    {symbol:"MSFT",shares:88,cost:283.56,group:"AI"},
    {symbol:"TSM",shares:61,cost:178.60,group:"AI"},
    {symbol:"QQQ",shares:38,cost:278.70,group:"Tech"},
    {symbol:"TLT",shares:209,cost:93.88,group:"Bond"},
    {symbol:"AMZN",shares:29,cost:260.65,group:"AI"},
    {symbol:"META",shares:12,cost:334.38,group:"AI"},
    {symbol:"TMF",shares:161,cost:56.62,group:"Leveraged"},
    {symbol:"UPRO",shares:30,cost:63.00,group:"Leveraged"},
    {symbol:"SGOV",shares:40,cost:100.47,group:"Cash"},
    {symbol:"TSLA",shares:2,cost:225.38,group:"Other"}
];

let allocationChart = null;

function formatMoney(v){
    return Number(v || 0).toLocaleString(undefined,{
        minimumFractionDigits:2,
        maximumFractionDigits:2
    });
}

async function getUSDCNY(){
    try{
        const r = await fetch("https://open.er-api.com/v6/latest/USD");
        const data = await r.json();
        return data.rates.CNY || 7.2;
    }catch{
        return 7.2;
    }
}

function clearContainers(){
    const tbody = document.getElementById("portfolioBody");
    if(tbody) tbody.innerHTML = "";

    const cards = document.getElementById("holdingCards");
    if(cards) cards.innerHTML = "";

    const top = document.getElementById("topHoldings");
    if(top) top.innerHTML = "";
}

async function loadPortfolio(){

    clearContainers();

    let totalValue = 0;
    let totalCost = 0;
    let totalPnl = 0;

    let aiValue = 0;
    let leveragedValue = 0;
    let bondValue = 0;
    let cashValue = 0;

    const positions = [];

    const results = await Promise.all(
        holdings.map(async h => {
            try{
                const r = await fetch(
                    `https://finnhub.io/api/v1/quote?symbol=${h.symbol}&token=${API_KEY}`
                );
                const data = await r.json();

                return {
                    holding:h,
                    price:Number(data.c || 0)
                };

            }catch{
                return {
                    holding:h,
                    price:0
                };
            }
        })
    );

    results.forEach(item => {

        const h = item.holding;
        const price = item.price;

        if(price <= 0) return;

        const marketValue = price * h.shares;
        const costValue = h.cost * h.shares;
        const pnl = marketValue - costValue;

        const returnPct = ((price - h.cost) / h.cost) * 100;

        totalValue += marketValue;
        totalCost += costValue;
        totalPnl += pnl;

        positions.push({
            symbol:h.symbol,
            value:marketValue
        });

        if(h.group==="AI") aiValue += marketValue;
        if(h.group==="Leveraged") leveragedValue += marketValue;
        if(h.group==="Bond") bondValue += marketValue;
        if(h.group==="Cash") cashValue += marketValue;

        item.marketValue = marketValue;
        item.pnl = pnl;
        item.returnPct = returnPct;
    });

    if(totalValue <= 0) return;

    positions.sort((a,b)=>b.value-a.value);
    results.sort((a,b)=>(b.marketValue||0)-(a.marketValue||0));

    const tbody = document.getElementById("portfolioBody");
    const cards = document.getElementById("holdingCards");
    const top = document.getElementById("topHoldings");

    let top3Exposure = 0;

    results.forEach(item => {

        if(!item.marketValue) return;

        const weight = item.marketValue / totalValue * 100;

        top3Exposure += weight;

        // TABLE
        if(tbody){

            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td>${item.holding.symbol}</td>
                <td>${item.holding.shares}</td>
                <td>${item.holding.cost.toFixed(2)}</td>
                <td>${item.price.toFixed(2)}</td>
                <td class="${item.returnPct>=0?'positive':'negative'}">
                    ${item.returnPct.toFixed(2)}%
                </td>
                <td>$${formatMoney(item.marketValue)}</td>
                <td class="${item.pnl>=0?'positive':'negative'}">
                    $${formatMoney(item.pnl)}
                </td>
                <td>${weight.toFixed(2)}%</td>
            `;

            tbody.appendChild(tr);
        }

        // MOBILE CARDS
        if(cards){

            const card = document.createElement("div");
            card.className = "holding-card";

            card.innerHTML = `
                <div class="holding-header">
                    <div class="symbol">${item.holding.symbol}</div>
                    <div class="shares">${item.holding.shares} 股</div>
                </div>

                <div class="holding-grid">

                    <div>
                        <div class="holding-label">现价</div>
                        <div class="holding-value">$${item.price.toFixed(2)}</div>
                    </div>

                    <div>
                        <div class="holding-label">成本</div>
                        <div class="holding-value">$${item.holding.cost.toFixed(2)}</div>
                    </div>

                    <div>
                        <div class="holding-label">收益率</div>
                        <div class="holding-value ${item.returnPct>=0?'positive':'negative'}">
                            ${item.returnPct.toFixed(2)}%
                        </div>
                    </div>

                    <div>
                        <div class="holding-label">占比</div>
                        <div class="holding-value">${weight.toFixed(2)}%</div>
                    </div>

                    <div>
                        <div class="holding-label">市值</div>
                        <div class="holding-value">$${formatMoney(item.marketValue)}</div>
                    </div>

                    <div>
                        <div class="holding-label">盈亏</div>
                        <div class="holding-value ${item.pnl>=0?'positive':'negative'}">
                            $${formatMoney(item.pnl)}
                        </div>
                    </div>

                </div>
            `;

            cards.appendChild(card);
        }
    });

    // TOP HOLDINGS
    if(top){

        positions.slice(0,5).forEach(p => {

            const w = p.value / totalValue * 100;

            const div = document.createElement("div");
            div.className = "top-item";

            div.innerHTML = `
                <div class="top-row">
                    <span class="top-symbol">${p.symbol}</span>
                    <span class="top-weight">${w.toFixed(2)}%</span>
                </div>

                <div class="top-bar">
                    <div class="top-fill" style="width:${w}%"></div>
                </div>
            `;

            top.appendChild(div);
        });
    }

    const usdCny = await getUSDCNY();

    document.getElementById("totalUsd").innerHTML =
        "$" + formatMoney(totalValue);

    document.getElementById("totalCny").innerHTML =
        "≈ ¥" + formatMoney(totalValue * usdCny);

    document.getElementById("totalPnl").innerHTML =
        "$" + formatMoney(totalPnl);

    document.getElementById("totalReturn").innerHTML =
        (totalPnl / totalCost * 100).toFixed(2) + "%";

    document.getElementById("aiWeight").innerHTML =
        (aiValue / totalValue * 100).toFixed(2) + "%";

    document.getElementById("leveragedWeight").innerHTML =
        (leveragedValue / totalValue * 100).toFixed(2) + "%";

    document.getElementById("bondWeight").innerHTML =
        (bondValue / totalValue * 100).toFixed(2) + "%";

    document.getElementById("cashWeight").innerHTML =
        (cashValue / totalValue * 100).toFixed(2) + "%";

    const largest = positions[0];
    document.getElementById("largestPosition").innerHTML =
        largest ? largest.symbol : "--";

    const nvda = positions.find(x => x.symbol==="NVDA");

    const nvdaWeight = nvda
        ? nvda.value / totalValue * 100
        : 0;

    document.getElementById("nvdaExposure").innerHTML =
        nvdaWeight.toFixed(2) + "%";

    document.getElementById("top3Exposure").innerHTML =
        top3Exposure.toFixed(2) + "%";

    let alerts = [];

    if(nvdaWeight > 35)
        alerts.push("⚠ NVDA仓位过高");

    if(leveragedValue / totalValue > 0.4)
        alerts.push("⚠ 杠杆仓位过高");

    if(bondValue / totalValue > 0.3)
        alerts.push("⚠ 债券暴露偏高");

    const alertBox = document.getElementById("riskAlerts");

    if(alertBox){

        alertBox.innerHTML = alerts.length
            ? alerts.map(x=>`<div>${x}</div>`).join("")
            : `<div style="background:#14532d;color:#bbf7d0;padding:10px 14px;border-radius:12px;">✓ 风险正常</div>`;
    }

    if(allocationChart)
        allocationChart.destroy();

    allocationChart = new Chart(
        document.getElementById("allocationChart"),
        {
            type:"doughnut",
            data:{
                labels:["AI","Leveraged","Bond","Cash"],
                datasets:[{
                    data:[
                        aiValue,
                        leveragedValue,
                        bondValue,
                        cashValue
                    ],
                    backgroundColor:[
                        "#2563eb",
                        "#7c3aed",
                        "#f59e0b",
                        "#22c55e"
                    ],
                    borderWidth:0
                }]
            },
            options:{
                responsive:true,
                maintainAspectRatio:false,
                plugins:{
                    legend:{
                        position:"bottom",
                        labels:{color:"#f8fafc"}
                    }
                }
            }
        }
    );

    const update = document.getElementById("lastUpdate");
    if(update){
        update.innerHTML =
        "更新时间 " +
        new Date().toLocaleTimeString("zh-CN");
    }
}

loadPortfolio();
setInterval(loadPortfolio, 60000);
