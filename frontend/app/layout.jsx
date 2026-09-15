import '../src/styles.css';

export const metadata = {
  title: 'SpeakWell',
  description: 'Practice English speaking fluency in real scenarios.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
