export const toastErr = (errors: null | Record<string, string[]>) => {
  if (!errors) return;
  return (
    <ul style={{ listStyle: "disc" }}>
      {Object.keys(errors).map((key) =>
        errors[key].map((err, ix) => (
          <li key={key + ix} style={{ marginRight: "32px" }}>
            {err}
          </li>
        ))
      )}
    </ul>
  );
};
