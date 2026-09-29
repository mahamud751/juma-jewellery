import Link from "next/link";

export default function NotFound() {
  return (
    <div className="lost">
      <p className="eyebrow">404</p>
      <h1>This frame is not in the salon.</h1>
      <p>The photograph or film you asked for is not here.</p>
      <Link href="/jewellery" className="line-btn">
        <span>See every frame</span>
      </Link>
    </div>
  );
}
