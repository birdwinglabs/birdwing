import { SpaceSeparatedNumberList } from "../attributes";
import { attribute, Model } from "../lib";

export class SplitablePageSectionModel extends Model {
  @attribute({ type: SpaceSeparatedNumberList, required: false })
  split: number[] = [];
  
  @attribute({ type: Boolean, required: false })
  mirror: boolean = false;
}
