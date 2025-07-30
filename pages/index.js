import useSWR from "swr";

const fetcher = url => fetch(url).then(res => res.json());

export default function Home() {
  const { data, error } = useSWR('/api/indicators', fetcher);

  if (error) return <p>Failed to load indicators.</p>;
  if (!data) return <p>Loading dashboard...</p>;

  const { indicators, score, totalScore, confidence } = data;
  const allConfirmed = score >= 7;
  const barColor = confidence >= 70 ? 'green' : confidence >= 50 ? 'orange' : 'gray';

  return (
    <div style={{ fontFamily: 'Arial', padding: '2rem', maxWidth: 800, margin: 'auto' }}>
      <h1>📈 Solana Exit Timing Dashboard</h1>
      <h2 style={{ color: allConfirmed ? 'green' : 'red' }}>
        {allConfirmed ? '✅ PHASE 2 CONFIRMED' : '❌ Phase 2 Not Fully Confirmed'}
      </h2>
      <div style={{ background: '#eee', borderRadius: '5px', width: '100%', height: '30px', margin: '20px 0' }}>
        <div style={{
          width: `${confidence}%`,
          height: '100%',
          background: barColor,
          borderRadius: '5px',
          textAlign: 'center',
          color: 'white',
          lineHeight: '30px'
        }}>
          {confidence}% Confidence
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {indicators.map((item, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: 'space-between',
            backgroundColor: '#f9f9f9',
            border: '1px solid #ccc',
            padding: '10px',
            borderRadius: '5px'
          }}>
            <strong>{item.indicator}</strong>
            <span>{item.conditionMet ? '✅' : '❌'} (Weight: {item.weight})</span>
          </div>
        ))}
      </div>
    </div>
  );
}
