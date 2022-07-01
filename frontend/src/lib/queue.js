import { Store } from "pullstate";

const queue = new Store({ next: null });

export default queue;
