class _Metadata:
    def create_all(self, bind=None):
        return None


class _Base:
    metadata = _Metadata()


Base = _Base()
engine = None
