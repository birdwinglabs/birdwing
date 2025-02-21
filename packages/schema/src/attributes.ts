
export class CommaSeparatedList {
  transform(value: string) {
    return value.split(',').map(v => v.trim());
  }
}

export class SpaceSeparatedList {
  transform(value: string) {
    return value.split(' ').map(v => v.trim());
  }
}

export class SpaceSeparatedNumberList {
  transform(value: string | undefined) {
    return value ? value.split(' ').map(v => parseInt(v.trim())) : [];
  }
}