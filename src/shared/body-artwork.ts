import artwork from "./body-front.json";
export { artwork };
export const names: Record<string, string> = {
  shoulders: "Shoulders",
  chest: "Chest",
  abs: "Abs",
  obliques: "Obliques",
  biceps: "Biceps",
  forearms: "Forearms",
  quads: "Quadriceps",
  calves: "Calves",
  traps: "Trapezius",
  rear_delts: "Rear delts",
  lats: "Lats",
  triceps: "Triceps",
  lower_back: "Lower back",
  glutes: "Glutes",
  hamstrings: "Hamstrings",
};
// Front outlines are extracted from the user's fitmap-body-front.svg.
// Back regions share its silhouette, scale, and bilateral construction.
export const back: Record<string, string[]> = {
  traps: [
    "M258 190 Q273 201 286 201 Q301 201 316 190 L321 210 Q338 219 358 230 L334 255 Q310 265 287 330 Q263 265 240 255 L216 230 Q240 219 253 209 Z",
  ],
  rear_delts: artwork.regions.shoulders,
  triceps: artwork.regions.biceps,
  lats: [
    "M209 291 Q221 310 245 276 Q267 293 282 333 L282 412 Q260 399 244 383 Q222 359 211 329 Z",
    "M365 291 Q353 310 329 276 Q307 293 292 333 L292 412 Q314 399 330 383 Q352 359 363 329 Z",
  ],
  lower_back: [
    "M246 389 Q260 406 282 417 L282 467 Q260 453 224 451 L222 433 Z",
    "M328 389 Q314 406 292 417 L292 467 Q314 453 350 451 L352 433 Z",
  ],
  glutes: [
    "M223 456 Q252 448 282 474 L282 535 Q255 560 210 538 Q202 504 223 456 Z",
    "M351 456 Q322 448 292 474 L292 535 Q319 560 364 538 Q372 504 351 456 Z",
  ],
  hamstrings: [
    "M211 545 Q244 561 278 543 Q275 596 260 641 L250 678 Q233 688 225 665 Q211 618 211 545 Z",
    "M363 545 Q330 561 296 543 Q299 596 314 641 L324 678 Q341 688 349 665 Q363 618 363 545 Z",
  ],
  calves: [
    "M209 704 Q224 694 235 710 Q250 697 253 729 Q258 765 239 801 L229 841 L219 817 Q197 793 198 755 Q198 724 209 704 Z",
    "M365 704 Q350 694 339 710 Q324 697 321 729 Q316 765 335 801 L345 841 L355 817 Q377 793 376 755 Q376 724 365 704 Z",
  ],
};
export const anchors: Record<string, [number, number]> = {
  shoulders: [190, 267],
  chest: [245, 281],
  biceps: [185, 343],
  forearms: [168, 434],
  abs: [286, 379],
  obliques: [231, 390],
  quads: [235, 574],
  calves: [225, 758],
  traps: [286, 265],
  rear_delts: [382, 267],
  triceps: [390, 343],
  lats: [327, 337],
  lower_back: [314, 433],
  glutes: [326, 504],
  hamstrings: [336, 596],
};

export const details = {
  front: [
    "M287 328 L287 485 M252 354 Q268 361 282 355 M292 355 Q308 361 323 354 M253 384 Q269 391 282 385 M292 385 Q309 391 322 384 M256 416 Q271 423 282 418 M292 418 Q306 423 319 416 M265 451 Q275 455 282 451 M292 451 Q302 455 311 451",
    "M219 274 Q241 290 273 289 M301 289 Q333 290 355 274 M222 340 L239 353 M222 361 L240 374 M223 383 L241 395 M352 340 L335 353 M352 361 L334 374 M351 383 L333 395",
    "M229 518 Q219 573 231 628 M345 518 Q355 573 343 628",
  ],
  back: [
    "M287 214 L287 458 M244 296 Q258 318 275 333 M330 296 Q316 318 299 333 M230 330 L267 374 M344 330 L307 374 M226 350 L264 390 M348 350 L310 390 M234 563 Q237 615 245 656 M340 563 Q337 615 329 656 M227 715 Q234 750 225 790 M347 715 Q340 750 349 790",
  ],
};
